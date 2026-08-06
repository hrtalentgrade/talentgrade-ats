import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import pdfParse from 'pdf-parse';

import { initDb, run, get, all } from './db.js';
import {
  authenticateToken,
  requireRole,
  logActivity,
  createNotification,
  JWT_SECRET
} from './middleware/auth.js';
import { parseJobDescription } from './services/jdParser.js';
import { calculateMatchScore, generateFollowUpQuestions } from './services/matchEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup cors and json/url parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folders exist
const uploadsDir = path.resolve(__dirname, 'uploads');
const selfiesDir = path.join(uploadsDir, 'selfies');
const resumesDir = path.join(uploadsDir, 'resumes');
const attachmentsDir = path.join(uploadsDir, 'attachments');
const avatarsDir = path.join(uploadsDir, 'avatars');
const jdsDir = path.join(uploadsDir, 'jds');

fs.mkdirSync(selfiesDir, { recursive: true });
fs.mkdirSync(resumesDir, { recursive: true });
fs.mkdirSync(attachmentsDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });
fs.mkdirSync(jdsDir, { recursive: true });

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Serve client static files if we compile the production build
const clientBuildPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Multer Storage configurations
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, attachmentsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `attach_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const jdStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, jdsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `jd_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const uploadResume = multer({ storage: resumeStorage });
const uploadAttachment = multer({ storage: attachmentStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadJD = multer({ storage: jdStorage });

// Helper to extract device and browser details from User-Agent
function parseUserAgent(ua) {
  let browser = 'Unknown Browser';
  let device = 'Desktop';

  if (!ua) return { browser, device };

  if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Edge')) browser = 'Microsoft Edge';

  if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) {
    device = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet';
  }
  return { browser, device };
}

function getIstTime() {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);
  const second = parseInt(parts.find(p => p.type === 'second').value);
  
  // Date formatting options
  const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
  const dateParts = dateFormatter.formatToParts(now);
  const year = dateParts.find(p => p.type === 'year').value;
  const month = dateParts.find(p => p.type === 'month').value;
  const day = dateParts.find(p => p.type === 'day').value;
  const dateStr = `${year}-${month}-${day}`;

  return { hour, minute, second, dateStr };
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body; // email or employee_id

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const user = await get(
      `SELECT u.*, t.name as team_name 
       FROM users u 
       LEFT JOIN teams t ON u.team_id = t.id 
       WHERE u.email = ? OR u.employee_id = ?`,
      [identifier, identifier]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        team_id: user.team_id,
        team_name: user.team_name,
        avatar_url: user.avatar_url
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    await logActivity(user.id, 'Login', 'User logged in successfully', clientIp);

    res.json({
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        team_id: user.team_id,
        team_name: user.team_name,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await get(
      `SELECT u.id, u.employee_id, u.email, u.full_name, u.role, u.team_id, u.avatar_url, t.name as team_name
       FROM users u
       LEFT JOIN teams t ON u.team_id = t.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Email address not found' });
    }

    // In a real application, send reset email. For internal app:
    await createNotification(
      user.id,
      'Password Reset Request',
      'A request to reset your password was registered. Please contact Super Admin to obtain a new temporary password.'
    );
    await logActivity(user.id, 'Password Reset', 'Requested password reset helper', '');

    res.json({ message: 'Password reset request registered. Contact Super Admin for assistance.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request reset' });
  }
});

app.post('/api/auth/punch-in', async (req, res) => {
  const { identifier, latitude, longitude, selfie } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Employee ID or Email is required' });
  }

  try {
    const user = await get('SELECT id, full_name, role FROM users WHERE email = ? OR employee_id = ?', [identifier, identifier]);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found. Please check your ID/Email.' });
    }

    const ist = getIstTime();
    const existing = await get('SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?', [user.id, ist.dateStr]);
    if (existing) {
      return res.json({ 
        alreadyPunchedIn: true, 
        message: 'Already punched in for today.', 
        user: { id: user.id, full_name: user.full_name, role: user.role } 
      });
    }

    // Step 1 check only (no selfie provided yet)
    if (!selfie) {
      return res.json({
        alreadyPunchedIn: false,
        message: 'Ready to perform selfie punch-in.',
        user: { id: user.id, full_name: user.full_name, role: user.role }
      });
    }

    // Threshold: Late if after 09:42 AM IST
    const totalMinutesInIst = ist.hour * 60 + ist.minute;
    const limitMinutes = 9 * 60 + 42; // 9:42 AM
    const isLate = totalMinutesInIst > limitMinutes ? 1 : 0;

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const { browser, device } = parseUserAgent(req.headers['user-agent']);
    const locationStr = latitude && longitude ? `${latitude}, ${longitude}` : 'Not Shared';

    // Decode and save selfie image
    let dbSelfiePath = 'Selfie Not Shared';
    const matches = selfie.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const imageBuffer = Buffer.from(matches[2], 'base64');
      const filename = `selfie_login_${user.id}_${Date.now()}.jpg`;
      const filePath = path.join(selfiesDir, filename);
      fs.writeFileSync(filePath, imageBuffer);
      dbSelfiePath = `/uploads/selfies/${filename}`;
    }

    await run(`
      INSERT INTO attendance (
        user_id, attendance_date, punch_in_time, punch_in_selfie_path,
        punch_in_ip, punch_in_browser, punch_in_device, punch_in_location, is_late
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id,
      ist.dateStr,
      new Date().toISOString(),
      dbSelfiePath,
      clientIp,
      browser,
      device,
      locationStr,
      isLate
    ]);

    await logActivity(user.id, 'Attendance Punch-In', `Punched in via login screen with live photo (IST: ${ist.hour}:${ist.minute})`, clientIp);

    res.json({
      message: 'Punch-in successful!',
      isLate: isLate === 1,
      user: { id: user.id, full_name: user.full_name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete initial punch-in' });
  }
});

// ==========================================
// 2. ATTENDANCE ENDPOINTS
// ==========================================

app.post('/api/attendance/punch-in', authenticateToken, async (req, res) => {
  const { selfie, latitude, longitude } = req.body;
  if (!selfie) return res.status(400).json({ error: 'Selfie image is required for punch-in' });

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const { browser, device } = parseUserAgent(req.headers['user-agent']);

  const today = new Date();
  const timeStr = today.toISOString();
  const ist = getIstTime();

  // Threshold: Late if after 09:42 AM IST
  const totalMinutesInIst = ist.hour * 60 + ist.minute;
  const limitMinutes = 9 * 60 + 42; // 9:42 AM
  const isLate = totalMinutesInIst > limitMinutes ? 1 : 0;

  try {
    // Check if already punched in today
    const existing = await get(
      'SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?',
      [req.user.id, ist.dateStr]
    );

    if (existing) {
      return res.status(400).json({ error: 'Already punched in for today' });
    }

    // Decode and save selfie image
    const matches = selfie.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid selfie image data format' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filename = `selfie_${req.user.id}_${Date.now()}.jpg`;
    const filePath = path.join(selfiesDir, filename);

    fs.writeFileSync(filePath, imageBuffer);
    const dbSelfiePath = `/uploads/selfies/${filename}`;
    const locationStr = latitude && longitude ? `${latitude}, ${longitude}` : 'Not Shared';

    const result = await run(`
      INSERT INTO attendance (user_id, attendance_date, punch_in_time, punch_in_selfie_path, punch_in_ip, punch_in_browser, punch_in_device, punch_in_location, is_late)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, ist.dateStr, timeStr, dbSelfiePath, clientIp, browser, device, locationStr, isLate]);

    await logActivity(req.user.id, 'Attendance Punch-In', `Punched in at ${today.toLocaleTimeString()}`, clientIp);

    res.json({
      message: 'Punch-in successful',
      attendanceId: result.id,
      punchInTime: timeStr,
      isLate: !!isLate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Attendance punch-in failed' });
  }
});

app.post('/api/attendance/punch-out', authenticateToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  const today = new Date();
  const timeStr = today.toISOString();
  const ist = getIstTime();

  try {
    const record = await get(
      'SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?',
      [req.user.id, ist.dateStr]
    );

    if (!record) {
      return res.status(404).json({ error: 'No punch-in record found for today' });
    }

    if (record.punch_out_time) {
      return res.status(400).json({ error: 'Already punched out for today' });
    }

    const punchIn = new Date(record.punch_in_time);
    const diffMs = today - punchIn;
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Overtime: working hours greater than 8.0 hours
    const overtimeHours = workingHours > 8 ? parseFloat((workingHours - 8).toFixed(2)) : 0;
    const locationStr = latitude && longitude ? `${latitude}, ${longitude}` : 'Not Shared';

    // Check if early punch-out (before 6:30 PM IST)
    const totalMinutesInIst = ist.hour * 60 + ist.minute;
    const limitMinutes = 18 * 60 + 30; // 18:30 IST
    const isEarly = totalMinutesInIst < limitMinutes;

    await run(`
      UPDATE attendance 
      SET punch_out_time = ?, working_hours = ?, overtime_hours = ?, punch_out_location = ?
      WHERE id = ?
    `, [timeStr, workingHours, overtimeHours, locationStr, record.id]);

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    await logActivity(req.user.id, 'Attendance Punch-Out', `Punched out with ${workingHours} hrs (IST: ${ist.hour}:${ist.minute})`, clientIp);

    res.json({
      message: isEarly ? 'Punch-out successful (Early Punch-Out recorded)' : 'Punch-out successful',
      isEarlyPunchOut: isEarly,
      punchOutTime: timeStr,
      workingHours,
      overtimeHours
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Attendance punch-out failed' });
  }
});

app.get('/api/attendance/today', authenticateToken, async (req, res) => {
  const dateStr = new Date().toISOString().split('T')[0];
  try {
    const record = await get(
      'SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?',
      [req.user.id, dateStr]
    );
    res.json({ record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve attendance' });
  }
});

app.get('/api/attendance/history', authenticateToken, async (req, res) => {
  try {
    const records = await all(
      `SELECT * FROM attendance WHERE user_id = ? ORDER BY attendance_date DESC LIMIT 30`,
      [req.user.id]
    );
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve attendance history' });
  }
});

// Admin/Team Leader scoped attendance list
app.get('/api/attendance/dashboard', authenticateToken, async (req, res) => {
  const { role, team_id, id } = req.user;

  try {
    let records = [];
    if (role === 'Super Admin') {
      records = await all(`
        SELECT a.*, u.full_name, u.employee_id, u.role as user_role, t.name as team_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        ORDER BY a.attendance_date DESC, a.punch_in_time DESC
        LIMIT 100
      `);
    } else if (role === 'Team Leader') {
      records = await all(`
        SELECT a.*, u.full_name, u.employee_id, u.role as user_role, t.name as team_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN teams t ON u.team_id = t.id
        WHERE u.team_id = ? OR u.id = ?
        ORDER BY a.attendance_date DESC, a.punch_in_time DESC
        LIMIT 100
      `, [team_id, id]);
    } else {
      records = await all(`
        SELECT a.*, u.full_name, u.employee_id, u.role as user_role, t.name as team_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE a.user_id = ?
        ORDER BY a.attendance_date DESC
        LIMIT 100
      `, [id]);
    }
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load attendance dashboard data' });
  }
});

// ==========================================
// 3. TEAM MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/teams', authenticateToken, async (req, res) => {
  try {
    const list = await all(`
      SELECT t.*, u.full_name as leader_name,
             (SELECT COUNT(*) FROM users WHERE team_id = t.id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
    `);
    res.json({ teams: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });

  try {
    const result = await run('INSERT INTO teams (name) VALUES (?)', [name]);
    await logActivity(req.user.id, 'Create Team', `Created team "${name}"`, '');
    res.json({ message: 'Team created successfully', teamId: result.id });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Team name already exists' });
    }
    res.status(500).json({ error: 'Failed to create team' });
  }
});

app.get('/api/teams/recruiters/unassigned', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  try {
    const users = await all(`
      SELECT id, full_name, employee_id, role, team_id
      FROM users
      WHERE role IN ('Recruiter', 'Team Leader')
      ORDER BY role, full_name
    `);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load recruiters list' });
  }
});

app.post('/api/teams/:id/assign-leader', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { id } = req.params; // team_id
  const { leaderId } = req.body;

  try {
    await run('UPDATE teams SET leader_id = ? WHERE id = ?', [leaderId, id]);
    if (leaderId) {
      await run('UPDATE users SET team_id = ? WHERE id = ?', [id, leaderId]);
      await createNotification(leaderId, 'Team Lead Assignment', 'You have been assigned as Team Leader for this team.');
    }
    await logActivity(req.user.id, 'Assign Team Leader', `Assigned user ${leaderId} as leader of team ${id}`, '');
    res.json({ message: 'Team Leader assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign team leader' });
  }
});

app.post('/api/teams/:id/add-member', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { id } = req.params; // team_id
  const { userId } = req.body;

  try {
    await run('UPDATE users SET team_id = ? WHERE id = ?', [id, userId]);
    await createNotification(userId, 'Team Assignment', 'You have been added to a new team.');
    await logActivity(req.user.id, 'Add Team Member', `Assigned user ${userId} to team ${id}`, '');
    res.json({ message: 'Member added to team successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member to team' });
  }
});

// ==========================================
// 4. VACANCY MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/vacancies', authenticateToken, async (req, res) => {
  const { role, team_id, id } = req.user;

  try {
    let list = [];
    if (role === 'Super Admin') {
      list = await all(`
        SELECT v.*, u.full_name as creator_name,
               (SELECT COUNT(*) FROM candidates WHERE vacancy_id = v.id) as candidate_count,
               (SELECT COUNT(*) FROM vacancy_assignments WHERE vacancy_id = v.id) as assignees_count
        FROM vacancies v
        LEFT JOIN users u ON v.created_by = u.id
        ORDER BY v.created_at DESC
      `);
    } else if (role === 'Team Leader') {
      // Vacancies created by TL OR assigned to them or their team members
      list = await all(`
        SELECT DISTINCT v.*, u.full_name as creator_name,
               (SELECT COUNT(*) FROM candidates WHERE vacancy_id = v.id) as candidate_count,
               (SELECT COUNT(*) FROM vacancy_assignments WHERE vacancy_id = v.id) as assignees_count
        FROM vacancies v
        LEFT JOIN users u ON v.created_by = u.id
        LEFT JOIN vacancy_assignments va ON v.id = va.vacancy_id
        LEFT JOIN users assignees ON va.assigned_to = assignees.id
        WHERE v.created_by = ? OR va.assigned_to = ? OR assignees.team_id = ?
        ORDER BY v.created_at DESC
      `, [id, id, team_id]);
    } else {
      // Recruiters: vacancies assigned to them
      list = await all(`
        SELECT v.*, u.full_name as creator_name,
               (SELECT COUNT(*) FROM candidates WHERE vacancy_id = v.id) as candidate_count
        FROM vacancies v
        JOIN vacancy_assignments va ON v.id = va.vacancy_id
        LEFT JOIN users u ON v.created_by = u.id
        WHERE va.assigned_to = ?
        ORDER BY v.created_at DESC
      `, [id]);
    }

    res.json({ vacancies: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

app.post('/api/vacancies', authenticateToken, requireRole(['Super Admin', 'Team Leader']), uploadJD.single('jd_file'), async (req, res) => {
  const { title, description, target_profiles, priority, deadline, remarks } = req.body;
  let { jd_raw_text } = req.body;
  let jd_file_path = null;

  if (!title || !description || !deadline) {
    return res.status(400).json({ error: 'Title, description, and deadline are required' });
  }

  try {
    // If a file is uploaded, parse it
    if (req.file) {
      jd_file_path = `/uploads/jds/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(req.file.path);
        const parsedData = await pdfParse(dataBuffer);
        jd_raw_text = parsedData.text;
      } else if (ext === '.txt') {
        jd_raw_text = fs.readFileSync(req.file.path, 'utf8');
      } else {
        // Fallback for doc/docx text
        jd_raw_text = `Job description text uploaded from ${req.file.originalname}`;
      }
    }

    // Run AI parsing heuristics
    const parsedJD = parseJobDescription(jd_raw_text || description);
    const jd_analysis = JSON.stringify(parsedJD.analysis);
    const jd_screening_questions = JSON.stringify(parsedJD.questions);
    const jd_eligibility_checklist = JSON.stringify(parsedJD.checklist);

    const result = await run(`
      INSERT INTO vacancies (
        title, description, target_profiles, priority, deadline, remarks, created_by,
        jd_raw_text, jd_file_path, jd_analysis, jd_screening_questions, jd_eligibility_checklist
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, description, target_profiles, priority || 'Medium', deadline, remarks, req.user.id,
      jd_raw_text || null, jd_file_path, jd_analysis, jd_screening_questions, jd_eligibility_checklist
    ]);

    await logActivity(req.user.id, 'Create Vacancy', `Created vacancy "${title}" with AI Intelligence`, '');
    res.json({ message: 'Vacancy created successfully', vacancyId: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vacancy' });
  }
});

app.get('/api/vacancies/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const vacancy = await get(
      `SELECT v.*, u.full_name as creator_name 
       FROM vacancies v 
       LEFT JOIN users u ON v.created_by = u.id 
       WHERE v.id = ?`,
      [id]
    );

    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    // Fetch assignments
    const assignments = await all(`
      SELECT va.*, u.full_name, u.role, u.employee_id
      FROM vacancy_assignments va
      JOIN users u ON va.assigned_to = u.id
      WHERE va.vacancy_id = ?
    `, [id]);

    // Fetch candidate metrics
    const candidates = await all(`
      SELECT id, name, email, pipeline_status, created_at, assigned_recruiter_id
      FROM candidates
      WHERE vacancy_id = ?
    `, [id]);

    res.json({ vacancy, assignments, candidates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load vacancy details' });
  }
});

app.post('/api/vacancies/:id/assign', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  const { id } = req.params; // vacancy_id
  const { assignedTo, targetSourcingCount } = req.body; // user_id of assignee

  if (!assignedTo) return res.status(400).json({ error: 'Assignee user_id is required' });

  try {
    // Add assignment
    await run(`
      INSERT OR IGNORE INTO vacancy_assignments (vacancy_id, assigned_to, assigned_by)
      VALUES (?, ?, ?)
    `, [id, assignedTo, req.user.id]);

    // Fetch vacancy title and deadline
    const vacancy = await get('SELECT title, deadline FROM vacancies WHERE id = ?', [id]);
    const targetCount = targetSourcingCount || 5;

    // Automatically create a sourcing task for the recruiter
    await run(`
      INSERT INTO tasks (vacancy_id, assigned_to, title, description, target_sourcing_count, status, deadline)
      VALUES (?, ?, ?, ?, ?, 'Assigned', ?)
    `, [
      id,
      assignedTo,
      `Sourcing Target: ${vacancy.title}`,
      `Identify and submit at least ${targetCount} qualified profiles matching vacancy guidelines before the deadline.`,
      targetCount,
      vacancy.deadline
    ]);

    await createNotification(
      assignedTo,
      'New Vacancy Assigned',
      `Vacancy "${vacancy.title}" has been assigned to you. Sourcing target is ${targetCount} candidates.`
    );

    await logActivity(req.user.id, 'Assign Vacancy', `Assigned vacancy ${id} to user ${assignedTo}`, '');

    res.json({ message: 'Vacancy assigned successfully and task created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign vacancy' });
  }
});

app.post('/api/vacancies/:id/assign-team', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { id } = req.params; // vacancy_id
  const { teamId, targetSubmissionsCount } = req.body;

  if (!teamId || !targetSubmissionsCount) {
    return res.status(400).json({ error: 'teamId and targetSubmissionsCount are required' });
  }

  try {
    // 1. Fetch team details
    const team = await get('SELECT name, leader_id FROM teams WHERE id = ?', [teamId]);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (!team.leader_id) {
      return res.status(400).json({ error: 'The selected team must have an assigned Team Leader first' });
    }

    // 2. Fetch vacancy details
    const vacancy = await get('SELECT title, deadline FROM vacancies WHERE id = ?', [id]);
    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    // 3. Insert or Update Team Sourcing Task
    const existing = await get('SELECT id FROM tasks WHERE vacancy_id = ? AND team_id = ? AND parent_task_id IS NULL', [id, teamId]);
    let taskId;

    if (existing) {
      taskId = existing.id;
      await run(`
        UPDATE tasks 
        SET target_submissions_count = ?, deadline = ?, assigned_to = ?
        WHERE id = ?
      `, [targetSubmissionsCount, vacancy.deadline, team.leader_id, taskId]);
    } else {
      const result = await run(`
        INSERT INTO tasks (
          vacancy_id, assigned_to, team_id, title, description,
          target_submissions_count, target_sourcing_count, status, deadline
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'Assigned', ?)
      `, [
        id,
        team.leader_id,
        teamId,
        `Team Target: ${vacancy.title}`,
        `Sourcing allocation for ${team.name}. Split sourcing and submission targets among recruiters.`,
        targetSubmissionsCount,
        vacancy.deadline
      ]);
      taskId = result.id;
    }

    // 4. Send notification to Team Leader
    await createNotification(
      team.leader_id,
      'New Team Sourcing Allocation',
      `Super Admin assigned vacancy "${vacancy.title}" to your team. Target quota: ${targetSubmissionsCount} profiles.`
    );

    await logActivity(req.user.id, 'Assign Vacancy Team', `Assigned vacancy ${id} to team ${teamId} (Target: ${targetSubmissionsCount})`, '');

    res.json({ message: 'Vacancy assigned to team successfully', taskId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign vacancy to team' });
  }
});

app.post('/api/tasks/:id/split', authenticateToken, requireRole(['Team Leader', 'Super Admin']), async (req, res) => {
  const { id } = req.params; // parent task_id
  const { assignments } = req.body; // array of { recruiterId, targetSourcingCount, targetSubmissionsCount }

  if (!Array.isArray(assignments)) {
    return res.status(400).json({ error: 'assignments must be an array' });
  }

  try {
    // 1. Fetch parent task
    const parentTask = await get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!parentTask) return res.status(404).json({ error: 'Team task not found' });
    if (!parentTask.team_id) {
      return res.status(400).json({ error: 'This task is not a Team Task allocation and cannot be split' });
    }

    // 2. Access control check for Team Leader
    if (req.user.role === 'Team Leader' && parentTask.team_id !== req.user.team_id) {
      return res.status(403).json({ error: 'You can only split tasks assigned to your own team' });
    }

    const vacancy = await get('SELECT title FROM vacancies WHERE id = ?', [parentTask.vacancy_id]);

    // 3. Run splitting inside database
    for (const assign of assignments) {
      const { recruiterId, targetSourcingCount, targetSubmissionsCount } = assign;
      if (!recruiterId) continue;

      // Make splitting idempotent: delete any pre-existing child task for this recruiter under this parent
      await run('DELETE FROM tasks WHERE parent_task_id = ? AND assigned_to = ?', [id, recruiterId]);

      // Create new child task
      await run(`
        INSERT INTO tasks (
          vacancy_id, assigned_to, parent_task_id, title, description,
          target_sourcing_count, target_submissions_count, status, deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Assigned', ?)
      `, [
        parentTask.vacancy_id,
        recruiterId,
        id,
        `Sourcing Target: ${vacancy.title}`,
        `Split target from your Team Leader. Source ${targetSourcingCount} profiles and get ${targetSubmissionsCount} approved submissions.`,
        targetSourcingCount,
        targetSubmissionsCount,
        parentTask.deadline
      ]);

      // Send notification to recruiter
      await createNotification(
        recruiterId,
        'Sourcing Quota Allocated',
        `Your TL has split Sourcing Targets for "${vacancy.title}": Sourcing: ${targetSourcingCount}, Submissions: ${targetSubmissionsCount}.`
      );
    }

    await logActivity(req.user.id, 'Split Task', `Split team task ${id} among ${assignments.length} recruiters`, '');

    res.json({ message: 'Team targets split successfully among recruiters' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to split task targets' });
  }
});

app.put('/api/vacancies/:id/status', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Open', 'Hold', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    await run('UPDATE vacancies SET status = ? WHERE id = ?', [status, id]);
    await logActivity(req.user.id, 'Update Vacancy Status', `Updated vacancy ${id} status to ${status}`, '');
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ==========================================
// 5. TASK MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { role, team_id, id } = req.user;

  try {
    let list = [];
    if (role === 'Super Admin') {
      list = await all(`
        SELECT t.*, u.full_name as recruiter_name, v.title as vacancy_title, tm.name as team_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN teams tm ON t.team_id = tm.id
        JOIN vacancies v ON t.vacancy_id = v.id
        ORDER BY t.deadline ASC
      `);
    } else if (role === 'Team Leader') {
      list = await all(`
        SELECT t.*, u.full_name as recruiter_name, v.title as vacancy_title, tm.name as team_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN teams tm ON t.team_id = tm.id
        JOIN vacancies v ON t.vacancy_id = v.id
        WHERE t.team_id = ? OR u.team_id = ? OR t.assigned_to = ?
        ORDER BY t.deadline ASC
      `, [team_id, team_id, id]);
    } else {
      list = await all(`
        SELECT t.*, u.full_name as recruiter_name, v.title as vacancy_title
        FROM tasks t
        JOIN users u ON t.assigned_to = u.id
        JOIN vacancies v ON t.vacancy_id = v.id
        WHERE t.assigned_to = ?
        ORDER BY t.deadline ASC
      `, [id]);
    }

    // Populate live statistics for each task
    const enrichedTasks = [];
    for (const t of list) {
      let sourcedProgress = 0;
      let submissionsProgress = 0;

      if (t.team_id && !t.parent_task_id) {
        // It's a Team Task: aggregate progress for all recruiters in the team
        const sourced = await get(`
          SELECT COUNT(*) as cnt 
          FROM candidates c 
          JOIN users u ON c.assigned_recruiter_id = u.id 
          WHERE u.team_id = ? AND c.vacancy_id = ?
        `, [t.team_id, t.vacancy_id]);
        sourcedProgress = sourced.cnt;

        const submitted = await get(`
          SELECT COUNT(*) as cnt 
          FROM candidates c 
          JOIN users u ON c.assigned_recruiter_id = u.id 
          WHERE u.team_id = ? AND c.vacancy_id = ? AND c.pipeline_status NOT IN ('New', 'Screening')
        `, [t.team_id, t.vacancy_id]);
        submissionsProgress = submitted.cnt;

        // Fetch child tasks split for recruiters (useful for TL and Super Admin views)
        const childTasks = await all(`
          SELECT t.*, u.full_name as recruiter_name
          FROM tasks t
          JOIN users u ON t.assigned_to = u.id
          WHERE t.parent_task_id = ?
        `, [t.id]);

        const enrichedChildTasks = [];
        for (const child of childTasks) {
          const childSourced = await get(`
            SELECT COUNT(*) as cnt FROM candidates 
            WHERE assigned_recruiter_id = ? AND vacancy_id = ?
          `, [child.assigned_to, child.vacancy_id]);
          
          const childSubmitted = await get(`
            SELECT COUNT(*) as cnt FROM candidates 
            WHERE assigned_recruiter_id = ? AND vacancy_id = ? AND pipeline_status NOT IN ('New', 'Screening')
          `, [child.assigned_to, child.vacancy_id]);

          // Auto-mark completed if targets are met!
          if (childSourced.cnt >= child.target_sourcing_count && childSubmitted.cnt >= child.target_submissions_count && child.status === 'Assigned') {
            await run("UPDATE tasks SET status = 'Completed' WHERE id = ?", [child.id]);
            child.status = 'Completed';
          }

          enrichedChildTasks.push({
            ...child,
            sourced_progress: childSourced.cnt,
            submissions_progress: childSubmitted.cnt
          });
        }
        t.child_tasks = enrichedChildTasks;
      } else {
        // It's an individual Recruiter Task
        const sourced = await get(`
          SELECT COUNT(*) as cnt FROM candidates 
          WHERE assigned_recruiter_id = ? AND vacancy_id = ?
        `, [t.assigned_to, t.vacancy_id]);
        sourcedProgress = sourced.cnt;

        const submitted = await get(`
          SELECT COUNT(*) as cnt FROM candidates 
          WHERE assigned_recruiter_id = ? AND vacancy_id = ? AND pipeline_status NOT IN ('New', 'Screening')
        `, [t.assigned_to, t.vacancy_id]);
        submissionsProgress = submitted.cnt;

        // Auto-mark completed if targets are met!
        if (sourcedProgress >= t.target_sourcing_count && submissionsProgress >= t.target_submissions_count && t.status === 'Assigned') {
          await run("UPDATE tasks SET status = 'Completed' WHERE id = ?", [t.id]);
          t.status = 'Completed';
        }
      }

      enrichedTasks.push({
        ...t,
        sourced_progress: sourcedProgress,
        submissions_progress: submissionsProgress
      });
    }

    res.json({ tasks: enrichedTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.put('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Assigned', 'In Progress', 'Submitted', 'Completed', 'Overdue', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid task status' });
  }

  try {
    // Access validation (recruiters can only edit their own tasks)
    const task = await get('SELECT assigned_to, vacancy_id FROM tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'Recruiter' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own tasks' });
    }

    await run('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    await logActivity(req.user.id, 'Update Task Status', `Updated task ${id} status to ${status}`, '');

    // Notify assignment creator or team leader
    const vacancy = await get('SELECT created_by, title FROM vacancies WHERE id = ?', [task.vacancy_id]);
    if (vacancy) {
      await createNotification(
        vacancy.created_by,
        'Task Status Updated',
        `${req.user.full_name} set task "${task.title || 'Vacancy'}" to "${status}".`
      );
    }

    res.json({ message: 'Task status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

app.get('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await all(`
      SELECT tc.*, u.full_name, u.avatar_url, u.role
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `, [id]);
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

app.post('/api/tasks/:id/comments', authenticateToken, uploadAttachment.single('attachment'), async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) return res.status(400).json({ error: 'Comment is required' });

  try {
    const attachmentPath = req.file ? `/uploads/attachments/${req.file.filename}` : null;
    await run(`
      INSERT INTO task_comments (task_id, user_id, comment, attachment_path)
      VALUES (?, ?, ?, ?)
    `, [id, req.user.id, comment, attachmentPath]);

    res.json({ message: 'Comment posted successfully', attachmentPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ==========================================
// 6. CANDIDATE & RESUME PARSER ENDPOINTS
// ==========================================

// Parse resume endpoint
app.post('/api/candidates/parse-resume', authenticateToken, uploadResume.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  let parsedText = '';

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdfParse(dataBuffer);
      parsedText = parsedData.text;
    } else {
      // DOC/DOCX parsing fallback: In simulated environment, extract strings using regex
      // or write dummy text parser
      parsedText = `Fallback resume text for ${req.file.originalname}`;
    }

    // Heuristics parser logic
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    const emails = parsedText.match(emailRegex) || [];
    const phones = parsedText.match(phoneRegex) || [];

    const email = emails[0] || '';
    const phone = phones[0] || '';

    // Extract Name: heuristic
    let name = '';
    const lines = parsedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      // Pick first line that doesn't look like email or metadata
      for (const line of lines) {
        if (!line.includes('@') && line.length < 50 && !line.toLowerCase().includes('resume') && !line.toLowerCase().includes('curriculum')) {
          name = line;
          break;
        }
      }
    }

    // Extract experience years
    let experience = 0;
    const expMatch = parsedText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (expMatch) {
      experience = parseInt(expMatch[1]);
    }

    // Extract skills from a set
    const skillsList = ['React', 'Node.js', 'Express', 'SQLite', 'PostgreSQL', 'SQL', 'MongoDB', 'Python', 'Java', 'Javascript', 'TypeScript', 'HTML', 'CSS', 'Sourcing', 'Talent Acquisition', 'HR', 'Excel', 'GitHub', 'AWS', 'Docker'];
    const detectedSkills = [];
    for (const skill of skillsList) {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      if (regex.test(parsedText)) {
        detectedSkills.push(skill);
      }
    }

    // Notice Period heuristics
    let noticePeriod = 30;
    const noticeMatch = parsedText.match(/(?:notice period|notice)\b\s*[:\-]?\s*(\d+)\s*(?:days|months|day|month)/i);
    if (noticeMatch) {
      const val = parseInt(noticeMatch[1]);
      noticePeriod = parsedText.match(/month/i) ? val * 30 : val;
    }

    // Location heuristics
    let location = '';
    const locationKeywords = ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Gurgaon', 'Noida', 'New York', 'London', 'San Francisco'];
    for (const city of locationKeywords) {
      if (new RegExp(city, 'i').test(parsedText)) {
        location = city;
        break;
      }
    }

    // Clean DB-ready file path
    const dbResumePath = `/uploads/resumes/${req.file.filename}`;

    res.json({
      name,
      email,
      phone,
      experience_years: experience,
      skills: detectedSkills.join(', '),
      location,
      notice_period_days: noticePeriod,
      resume_path: dbResumePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse resume PDF' });
  }
});

// Candidate duplicate checker
app.post('/api/candidates/check-duplicate', authenticateToken, async (req, res) => {
  const { email, phone } = req.body;
  try {
    const matchEmail = await get('SELECT id, name FROM candidates WHERE email = ?', [email]);
    const matchPhone = await get('SELECT id, name FROM candidates WHERE phone = ?', [phone]);

    if (matchEmail || matchPhone) {
      return res.json({
        isDuplicate: true,
        reason: matchEmail
          ? `Email matches existing candidate "${matchEmail.name}"`
          : `Phone matches existing candidate "${matchPhone.name}"`
      });
    }
    res.json({ isDuplicate: false });
  } catch (err) {
    res.status(500).json({ error: 'Duplicate check query failed' });
  }
});

// Add Candidate
app.post('/api/candidates', authenticateToken, async (req, res) => {
  const {
    name,
    email,
    phone,
    nationality,
    location,
    experience_years,
    skills,
    current_salary,
    expected_salary,
    notice_period_days,
    current_position,
    resume_path,
    vacancy_id,
    pipeline_status
  } = req.body;

  if (!name || !email || !phone || !vacancy_id) {
    return res.status(400).json({ error: 'Name, email, phone and vacancy are required' });
  }

  try {
    // Double check duplicate
    const duplicate = await get(
      'SELECT id, name FROM candidates WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (duplicate) {
      return res.status(400).json({ error: `Duplicate candidate detected: Already exists as "${duplicate.name}"` });
    }

    const result = await run(`
      INSERT INTO candidates (
        name, email, phone, nationality, location, experience_years, skills,
        current_salary, expected_salary, notice_period_days, current_position,
        resume_path, vacancy_id, assigned_recruiter_id, pipeline_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, email, phone, nationality, location, experience_years || 0, skills,
      current_salary, expected_salary, notice_period_days || 30, current_position,
      resume_path, vacancy_id, req.user.id, pipeline_status || 'New'
    ]);

    // Log timeline
    await run(`
      INSERT INTO candidate_timeline (candidate_id, action_type, details, performed_by)
      VALUES (?, 'Created', 'Candidate profiles uploaded and registered.', ?)
    `, [result.id, req.user.id]);

    await logActivity(req.user.id, 'Add Candidate', `Registered candidate "${name}" for vacancy ${vacancy_id}`, '');

    // Log check if task updates target status (e.g. increments submitted count)
    res.json({ message: 'Candidate added successfully', candidateId: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create candidate record' });
  }
});

// Candidates fetch list (RBAC scoped)
app.get('/api/candidates', authenticateToken, async (req, res) => {
  const { role, team_id, id } = req.user;
  const { vacancy_id, search, pipeline_status } = req.query;

  try {
    let query = `
      SELECT c.*, v.title as vacancy_title, u.full_name as recruiter_name
      FROM candidates c
      JOIN vacancies v ON c.vacancy_id = v.id
      LEFT JOIN users u ON c.assigned_recruiter_id = u.id
    `;
    const params = [];
    const conditions = [];

    // Role-based visibility
    if (role === 'Team Leader') {
      conditions.push(`(u.team_id = ? OR c.assigned_recruiter_id = ?)`);
      params.push(team_id, id);
    } else if (role === 'Recruiter') {
      conditions.push(`c.assigned_recruiter_id = ?`);
      params.push(id);
    }

    // Additional filters
    if (vacancy_id) {
      conditions.push(`c.vacancy_id = ?`);
      params.push(vacancy_id);
    }

    if (pipeline_status) {
      conditions.push(`c.pipeline_status = ?`);
      params.push(pipeline_status);
    }

    if (search) {
      conditions.push(`(c.name LIKE ? OR c.email LIKE ? OR c.skills LIKE ? OR c.location LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY c.created_at DESC`;

    const list = await all(query, params);
    res.json({ candidates: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load candidates' });
  }
});

app.get('/api/candidates/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await get(`
      SELECT c.*, v.title as vacancy_title, u.full_name as recruiter_name
      FROM candidates c
      JOIN vacancies v ON c.vacancy_id = v.id
      LEFT JOIN users u ON c.assigned_recruiter_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const timeline = await all(`
      SELECT ct.*, u.full_name, u.role
      FROM candidate_timeline ct
      JOIN users u ON ct.performed_by = u.id
      WHERE ct.candidate_id = ?
      ORDER BY ct.created_at DESC
    `, [id]);

    res.json({ candidate, timeline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load candidate details' });
  }
});

// Update Pipeline status
app.put('/api/candidates/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { pipeline_status } = req.body;

  const validStatuses = ['New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'];
  if (!validStatuses.includes(pipeline_status)) {
    return res.status(400).json({ error: 'Invalid pipeline status' });
  }

  try {
    const candidate = await get('SELECT name, pipeline_status, assigned_recruiter_id, vacancy_id FROM candidates WHERE id = ?', [id]);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    if (req.user.role === 'Recruiter' && candidate.assigned_recruiter_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to manage this candidate' });
    }

    const oldStatus = candidate.pipeline_status;
    await run('UPDATE candidates SET pipeline_status = ? WHERE id = ?', [pipeline_status, id]);

    // Create Timeline entry
    await run(`
      INSERT INTO candidate_timeline (candidate_id, action_type, details, performed_by)
      VALUES (?, 'Status Change', ?, ?)
    `, [id, `Changed status from "${oldStatus}" to "${pipeline_status}"`, req.user.id]);

    await logActivity(req.user.id, 'Candidate Status Change', `Updated candidate ${candidate.name} status to ${pipeline_status}`, '');

    // Notify Vacancy creator
    const vacancy = await get('SELECT created_by, title FROM vacancies WHERE id = ?', [candidate.vacancy_id]);
    if (vacancy) {
      await createNotification(
        vacancy.created_by,
        'Pipeline Status Changed',
        `${req.user.full_name} moved candidate "${candidate.name}" to "${pipeline_status}" for vacancy "${vacancy.title}".`
      );
    }

    res.json({ message: 'Pipeline status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update pipeline status' });
  }
});

// ==========================================
// AI SCREENING & VACANCY INTELLIGENCE ENDPOINTS
// ==========================================

app.get('/api/vacancies/:id/intelligence', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await get('SELECT jd_analysis, jd_screening_questions, jd_eligibility_checklist, jd_raw_text, jd_file_path FROM vacancies WHERE id = ?', [id]);
    if (!data) return res.status(404).json({ error: 'Vacancy not found' });
    
    res.json({
      jd_analysis: data.jd_analysis ? JSON.parse(data.jd_analysis) : null,
      jd_screening_questions: data.jd_screening_questions ? JSON.parse(data.jd_screening_questions) : null,
      jd_eligibility_checklist: data.jd_eligibility_checklist ? JSON.parse(data.jd_eligibility_checklist) : null,
      jd_raw_text: data.jd_raw_text,
      jd_file_path: data.jd_file_path
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve vacancy intelligence' });
  }
});

app.post('/api/candidates/:id/match', authenticateToken, async (req, res) => {
  const { id } = req.params; // candidate_id
  const { vacancyId, answers } = req.body;
  if (!vacancyId) return res.status(400).json({ error: 'Vacancy ID is required' });

  try {
    const candidate = await get('SELECT * FROM candidates WHERE id = ?', [id]);
    const vacancy = await get('SELECT * FROM vacancies WHERE id = ?', [vacancyId]);
    if (!candidate || !vacancy) return res.status(404).json({ error: 'Candidate or Vacancy not found' });

    const matchResult = calculateMatchScore(candidate, vacancy, answers || null);
    const followUps = generateFollowUpQuestions(answers || null, matchResult.missingInfo);

    res.json({
      matchResult,
      followUps
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate match score' });
  }
});

app.post('/api/screenings', authenticateToken, async (req, res) => {
  const {
    candidateId, vacancyId, answers, followUpQuestions, aiMatchScores,
    missingInfo, recruiterNotes, recruiterRecommendation, aiReasoning
  } = req.body;

  if (!candidateId || !vacancyId || !recruiterRecommendation) {
    return res.status(400).json({ error: 'Candidate ID, Vacancy ID, and Recommendation are required' });
  }

  try {
    // Check if screening already exists
    const existing = await get('SELECT id FROM screenings WHERE candidate_id = ? AND vacancy_id = ?', [candidateId, vacancyId]);

    if (existing) {
      await run(`
        UPDATE screenings
        SET answers = ?, follow_up_questions = ?, ai_match_scores = ?, missing_info = ?,
            recruiter_notes = ?, recruiter_recommendation = ?, ai_reasoning = ?
        WHERE id = ?
      `, [
        JSON.stringify(answers), JSON.stringify(followUpQuestions), JSON.stringify(aiMatchScores),
        JSON.stringify(missingInfo), recruiterNotes, recruiterRecommendation, aiReasoning, existing.id
      ]);
      
      await logActivity(req.user.id, 'Update Screening', `Updated screening dossier for candidate ${candidateId}`, '');
      return res.json({ message: 'Screening updated successfully', screeningId: existing.id });
    }

    const result = await run(`
      INSERT INTO screenings (
        candidate_id, vacancy_id, recruiter_id, answers, follow_up_questions,
        ai_match_scores, missing_info, recruiter_notes, recruiter_recommendation, ai_reasoning
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      candidateId, vacancyId, req.user.id, JSON.stringify(answers), JSON.stringify(followUpQuestions),
      JSON.stringify(aiMatchScores), JSON.stringify(missingInfo), recruiterNotes, recruiterRecommendation, aiReasoning
    ]);

    // Log timeline entry on candidate
    await run(`
      INSERT INTO candidate_timeline (candidate_id, action_type, details, performed_by)
      VALUES (?, 'Screening Completed', ?, ?)
    `, [candidateId, `Completed initial screening with recommendation: ${recruiterRecommendation}`, req.user.id]);

    await logActivity(req.user.id, 'Complete Screening', `Created screening checklist for candidate ${candidateId}`, '');

    res.json({ message: 'Screening registered successfully', screeningId: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record screening data' });
  }
});

app.get('/api/screenings/candidate/:candidateId', authenticateToken, async (req, res) => {
  const { candidateId } = req.params;
  try {
    const row = await get(`
      SELECT s.*, u.full_name as recruiter_name, approver.full_name as approver_name
      FROM screenings s
      JOIN users u ON s.recruiter_id = u.id
      LEFT JOIN users approver ON s.tl_approved_by = approver.id
      WHERE s.candidate_id = ?
    `, [candidateId]);
    
    if (!row) return res.json({ screening: null });

    res.json({
      screening: {
        ...row,
        answers: row.answers ? JSON.parse(row.answers) : null,
        follow_up_questions: row.follow_up_questions ? JSON.parse(row.follow_up_questions) : null,
        ai_match_scores: row.ai_match_scores ? JSON.parse(row.ai_match_scores) : null,
        missing_info: row.missing_info ? JSON.parse(row.missing_info) : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch screening details' });
  }
});

app.get('/api/screenings/pending-reviews', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  const { role, team_id, id } = req.user;
  try {
    let list = [];
    if (role === 'Super Admin') {
      list = await all(`
        SELECT s.*, c.name as candidate_name, v.title as vacancy_title, u.full_name as recruiter_name
        FROM screenings s
        JOIN candidates c ON s.candidate_id = c.id
        JOIN vacancies v ON s.vacancy_id = v.id
        JOIN users u ON s.recruiter_id = u.id
        WHERE s.is_approved_by_tl = 0
        ORDER BY s.created_at DESC
      `);
    } else {
      // Team Leader: pending reviews for recruiters in their team
      list = await all(`
        SELECT s.*, c.name as candidate_name, v.title as vacancy_title, u.full_name as recruiter_name
        FROM screenings s
        JOIN candidates c ON s.candidate_id = c.id
        JOIN vacancies v ON s.vacancy_id = v.id
        JOIN users u ON s.recruiter_id = u.id
        WHERE s.is_approved_by_tl = 0 AND (u.team_id = ? OR s.recruiter_id = ?)
        ORDER BY s.created_at DESC
      `, [team_id, id]);
    }

    res.json({
      pending: list.map(row => ({
        ...row,
        answers: row.answers ? JSON.parse(row.answers) : null,
        ai_match_scores: row.ai_match_scores ? JSON.parse(row.ai_match_scores) : null,
        missing_info: row.missing_info ? JSON.parse(row.missing_info) : null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load pending reviews' });
  }
});

app.put('/api/screenings/:id/approve', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  const { id } = req.params; // screening_id
  const today = new Date().toISOString();

  try {
    const screening = await get('SELECT candidate_id, vacancy_id FROM screenings WHERE id = ?', [id]);
    if (!screening) return res.status(404).json({ error: 'Screening not found' });

    await run(`
      UPDATE screenings
      SET is_approved_by_tl = 1, tl_approved_by = ?, tl_approved_at = ?
      WHERE id = ?
    `, [req.user.id, today, id]);

    // Automatically upgrade candidate pipeline status to 'Submitted'
    await run("UPDATE candidates SET pipeline_status = 'Submitted' WHERE id = ?", [screening.candidate_id]);

    // Log timeline entry
    await run(`
      INSERT INTO candidate_timeline (candidate_id, action_type, details, performed_by)
      VALUES (?, 'Screening Approved', 'Team Leader reviewed and approved screening details. Profile submitted to client.', ?)
    `, [screening.candidate_id, req.user.id]);

    // Notify recruiter
    const candidate = await get('SELECT name, assigned_recruiter_id FROM candidates WHERE id = ?', [screening.candidate_id]);
    if (candidate) {
      await createNotification(
        candidate.assigned_recruiter_id,
        'Screening Submission Approved',
        `Your screening submission for candidate "${candidate.name}" has been approved by ${req.user.full_name}. Candidate moved to "Submitted".`
      );
    }

    await logActivity(req.user.id, 'Approve Screening', `Approved candidate ${screening.candidate_id} screening submission`, '');

    res.json({ message: 'Screening submission approved. Candidate moved to Submitted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve screening' });
  }
});

// ==========================================
// 7. VENDOR MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/vendors', authenticateToken, async (req, res) => {
  const { role, team_id, id } = req.user;

  try {
    let list = [];
    if (role === 'Super Admin') {
      list = await all(`
        SELECT v.*, u.full_name as manager_name
        FROM vendors v
        JOIN users u ON v.managed_by = u.id
        ORDER BY v.created_at DESC
      `);
    } else if (role === 'Team Leader') {
      list = await all(`
        SELECT v.*, u.full_name as manager_name
        FROM vendors v
        JOIN users u ON v.managed_by = u.id
        WHERE u.team_id = ? OR v.managed_by = ?
        ORDER BY v.created_at DESC
      `, [team_id, id]);
    } else {
      list = await all(`
        SELECT v.*, u.full_name as manager_name
        FROM vendors v
        JOIN users u ON v.managed_by = u.id
        WHERE v.managed_by = ?
        ORDER BY v.created_at DESC
      `, [id]);
    }

    res.json({ vendors: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

app.post('/api/vendors', authenticateToken, async (req, res) => {
  const { company_name, poc_name, phone, whatsapp, email, countries, specialization, remarks } = req.body;

  if (!company_name || !poc_name || !email) {
    return res.status(400).json({ error: 'Company Name, POC Name, and Email are required' });
  }

  try {
    const result = await run(`
      INSERT INTO vendors (company_name, poc_name, phone, whatsapp, email, countries, specialization, remarks, managed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [company_name, poc_name, phone, whatsapp, email, countries, specialization, remarks, req.user.id]);

    await logActivity(req.user.id, 'Create Vendor', `Registered B2B partner "${company_name}"`, '');
    res.json({ message: 'Vendor registered successfully', vendorId: result.id });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Vendor email already exists' });
    }
    res.status(500).json({ error: 'Failed to register vendor' });
  }
});

// ==========================================
// 8. GLOBAL SEARCH & NOTIFICATION APIs
// ==========================================

app.get('/api/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ candidates: [], recruiters: [], vendors: [], vacancies: [], teams: [] });

  const queryLike = `%${q}%`;

  try {
    // 1. Search Candidates
    const candidates = await all(
      'SELECT id, name, email, pipeline_status as status, skills FROM candidates WHERE name LIKE ? OR email LIKE ? OR skills LIKE ? LIMIT 10',
      [queryLike, queryLike, queryLike]
    );

    // 2. Search Recruiters
    const recruiters = await all(
      "SELECT id, full_name as name, email, employee_id FROM users WHERE role='Recruiter' AND (full_name LIKE ? OR email LIKE ? OR employee_id LIKE ?) LIMIT 10",
      [queryLike, queryLike, queryLike]
    );

    // 3. Search Vendors
    const vendors = await all(
      'SELECT id, company_name as name, poc_name, email FROM vendors WHERE company_name LIKE ? OR poc_name LIKE ? OR email LIKE ? LIMIT 10',
      [queryLike, queryLike, queryLike]
    );

    // 4. Search Vacancies
    const vacancies = await all(
      'SELECT id, title as name, status, priority FROM vacancies WHERE title LIKE ? OR remarks LIKE ? LIMIT 10',
      [queryLike, queryLike]
    );

    // 5. Search Teams
    const teams = await all(
      'SELECT id, name FROM teams WHERE name LIKE ? LIMIT 10',
      [queryLike]
    );

    res.json({ candidates, recruiters, vendors, vacancies, teams });
  } catch (err) {
    res.status(500).json({ error: 'Global search failed' });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const list = await all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json({ notifications: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read notifications' });
  }
});

app.get('/api/activity-logs', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  const { role, team_id } = req.user;
  try {
    let logs = [];
    if (role === 'Super Admin') {
      logs = await all(`
        SELECT l.*, u.full_name, u.employee_id, u.role
        FROM activity_logs l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC LIMIT 200
      `);
    } else {
      logs = await all(`
        SELECT l.*, u.full_name, u.employee_id, u.role
        FROM activity_logs l
        JOIN users u ON l.user_id = u.id
        WHERE u.team_id = ?
        ORDER BY l.created_at DESC LIMIT 200
      `, [team_id]);
    }
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// ==========================================
// 9. PROFILE & AVATAR UPLOAD ENDPOINTS
// ==========================================

app.post('/api/profile/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No avatar image file uploaded' });

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    await run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    await logActivity(req.user.id, 'Update Profile Avatar', 'Uploaded new cropped avatar image', '');

    res.json({ message: 'Profile photo updated successfully', avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save avatar image' });
  }
});

// ==========================================
// 10. DASHBOARD STATISTICS
// ==========================================

app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
  const { role, team_id, id } = req.user;

  try {
    let totalVacancies = 0;
    let openVacancies = 0;
    let totalCandidates = 0;
    let candidatePipelineFunnel = {};
    let taskStats = { total: 0, completed: 0, pending: 0, overdue: 0 };
    let recruiterRanking = [];
    let offersCount = 0;
    let joiningsCount = 0;

    // Build Pipeline object
    const statuses = ['New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'];
    statuses.forEach(s => { candidatePipelineFunnel[s] = 0; });

    if (role === 'Super Admin') {
      // 1. Vacancies
      const vacs = await get('SELECT COUNT(*) as tot, SUM(CASE WHEN status="Open" THEN 1 ELSE 0 END) as opn FROM vacancies');
      totalVacancies = vacs.tot || 0;
      openVacancies = vacs.opn || 0;

      // 2. Candidates
      const cands = await get('SELECT COUNT(*) as tot FROM candidates');
      totalCandidates = cands.tot || 0;

      // Funnel
      const funnelRows = await all('SELECT pipeline_status, COUNT(*) as count FROM candidates GROUP BY pipeline_status');
      funnelRows.forEach(r => {
        if (candidatePipelineFunnel[r.pipeline_status] !== undefined) {
          candidatePipelineFunnel[r.pipeline_status] = r.count;
        }
      });

      // Offers & Joinings
      offersCount = candidatePipelineFunnel['Offer'] || 0;
      joiningsCount = candidatePipelineFunnel['Joined'] || 0;

      // 3. Tasks
      const tasks = await get(`
        SELECT COUNT(*) as tot,
               SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as comp,
               SUM(CASE WHEN status='Overdue' THEN 1 ELSE 0 END) as ovrd
        FROM tasks
      `);
      taskStats.total = tasks.tot || 0;
      taskStats.completed = tasks.comp || 0;
      taskStats.overdue = tasks.ovrd || 0;
      taskStats.pending = taskStats.total - taskStats.completed;

      // 4. Recruiter rankings (Candidates who joined or are offered, weighted)
      recruiterRanking = await all(`
        SELECT u.id, u.full_name, u.employee_id,
               COUNT(c.id) as total_sourced,
               SUM(CASE WHEN c.pipeline_status='Joined' THEN 1 ELSE 0 END) as joined_count,
               SUM(CASE WHEN c.pipeline_status='Offer' THEN 1 ELSE 0 END) as offered_count
        FROM users u
        LEFT JOIN candidates c ON u.id = c.assigned_recruiter_id
        WHERE u.role = 'Recruiter'
        GROUP BY u.id
        ORDER BY joined_count DESC, offered_count DESC, total_sourced DESC
        LIMIT 10
      `);

    } else if (role === 'Team Leader') {
      // 1. Vacancies
      const vacs = await get(`
        SELECT COUNT(DISTINCT v.id) as tot,
               SUM(CASE WHEN v.status="Open" THEN 1 ELSE 0 END) as opn
        FROM vacancies v
        LEFT JOIN vacancy_assignments va ON v.id = va.vacancy_id
        LEFT JOIN users u ON va.assigned_to = u.id
        WHERE v.created_by = ? OR va.assigned_to = ? OR u.team_id = ?
      `, [id, id, team_id]);
      totalVacancies = vacs.tot || 0;
      openVacancies = vacs.opn || 0;

      // 2. Candidates in Team
      const cands = await get(`
        SELECT COUNT(*) as tot
        FROM candidates c
        JOIN users u ON c.assigned_recruiter_id = u.id
        WHERE u.team_id = ? OR c.assigned_recruiter_id = ?
      `, [team_id, id]);
      totalCandidates = cands.tot || 0;

      // Funnel
      const funnelRows = await all(`
        SELECT c.pipeline_status, COUNT(*) as count
        FROM candidates c
        JOIN users u ON c.assigned_recruiter_id = u.id
        WHERE u.team_id = ? OR c.assigned_recruiter_id = ?
        GROUP BY c.pipeline_status
      `, [team_id, id]);
      funnelRows.forEach(r => {
        if (candidatePipelineFunnel[r.pipeline_status] !== undefined) {
          candidatePipelineFunnel[r.pipeline_status] = r.count;
        }
      });

      offersCount = candidatePipelineFunnel['Offer'] || 0;
      joiningsCount = candidatePipelineFunnel['Joined'] || 0;

      // Tasks
      const tasks = await get(`
        SELECT COUNT(*) as tot,
               SUM(CASE WHEN t.status='Completed' THEN 1 ELSE 0 END) as comp,
               SUM(CASE WHEN t.status='Overdue' THEN 1 ELSE 0 END) as ovrd
        FROM tasks t
        JOIN users u ON t.assigned_to = u.id
        WHERE u.team_id = ? OR u.id = ?
      `, [team_id, id]);
      taskStats.total = tasks.tot || 0;
      taskStats.completed = tasks.comp || 0;
      taskStats.overdue = tasks.ovrd || 0;
      taskStats.pending = taskStats.total - taskStats.completed;

      // Team Recruiter Rankings
      recruiterRanking = await all(`
        SELECT u.id, u.full_name, u.employee_id,
               COUNT(c.id) as total_sourced,
               SUM(CASE WHEN c.pipeline_status='Joined' THEN 1 ELSE 0 END) as joined_count,
               SUM(CASE WHEN c.pipeline_status='Offer' THEN 1 ELSE 0 END) as offered_count
        FROM users u
        LEFT JOIN candidates c ON u.id = c.assigned_recruiter_id
        WHERE u.role = 'Recruiter' AND u.team_id = ?
        GROUP BY u.id
        ORDER BY joined_count DESC, offered_count DESC
      `, [team_id]);

    } else {
      // Recruiters: Own stats only
      const vacs = await get(`
        SELECT COUNT(DISTINCT vacancy_id) as tot
        FROM vacancy_assignments
        WHERE assigned_to = ?
      `, [id]);
      totalVacancies = vacs.tot || 0;
      openVacancies = totalVacancies; // Assigned vacancies are assumed active

      const cands = await get('SELECT COUNT(*) as tot FROM candidates WHERE assigned_recruiter_id = ?', [id]);
      totalCandidates = cands.tot || 0;

      // Funnel
      const funnelRows = await all(`
        SELECT pipeline_status, COUNT(*) as count
        FROM candidates
        WHERE assigned_recruiter_id = ?
        GROUP BY pipeline_status
      `, [id]);
      funnelRows.forEach(r => {
        if (candidatePipelineFunnel[r.pipeline_status] !== undefined) {
          candidatePipelineFunnel[r.pipeline_status] = r.count;
        }
      });

      offersCount = candidatePipelineFunnel['Offer'] || 0;
      joiningsCount = candidatePipelineFunnel['Joined'] || 0;

      // Tasks
      const tasks = await get(`
        SELECT COUNT(*) as tot,
               SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as comp,
               SUM(CASE WHEN status='Overdue' THEN 1 ELSE 0 END) as ovrd
        FROM tasks
        WHERE assigned_to = ?
      `, [id]);
      taskStats.total = tasks.tot || 0;
      taskStats.completed = tasks.comp || 0;
      taskStats.overdue = tasks.ovrd || 0;
      taskStats.pending = taskStats.total - taskStats.completed;
    }

    res.json({
      totalVacancies,
      openVacancies,
      totalCandidates,
      candidatePipelineFunnel,
      taskStats,
      recruiterRanking,
      offersCount,
      joiningsCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// ==========================================
// 11. REPORTS GENERATION DATA
// ==========================================

app.get('/api/reports/recruiter-performance', authenticateToken, requireRole(['Super Admin', 'Team Leader']), async (req, res) => {
  const { team_id, role } = req.user;
  try {
    let query = `
      SELECT u.id, u.full_name, u.employee_id, t.name as team_name,
             COUNT(c.id) as sourced_count,
             SUM(CASE WHEN c.pipeline_status = 'Screening' THEN 1 ELSE 0 END) as screening_count,
             SUM(CASE WHEN c.pipeline_status = 'Interview' THEN 1 ELSE 0 END) as interview_count,
             SUM(CASE WHEN c.pipeline_status = 'Offer' THEN 1 ELSE 0 END) as offer_count,
             SUM(CASE WHEN c.pipeline_status = 'Joined' THEN 1 ELSE 0 END) as joined_count,
             (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id AND status = 'Completed') as tasks_completed,
             (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id) as tasks_total
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN candidates c ON u.id = c.assigned_recruiter_id
      WHERE u.role = 'Recruiter'
    `;
    const params = [];
    if (role === 'Team Leader') {
      query += ` AND u.team_id = ? `;
      params.push(team_id);
    }
    query += ` GROUP BY u.id ORDER BY joined_count DESC, offer_count DESC `;

    const data = await all(query, params);
    res.json({ report: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate recruiter performance report' });
  }
});

app.get('/api/reports/vendor-performance', authenticateToken, async (req, res) => {
  // Simulates performance reporting. Since vendors submit candidates, let's link candidates
  // In a future schema expansion, vendors upload candidates. For now, simulate rating based on vendor records.
  try {
    const vendors = await all(`
      SELECT v.*, u.full_name as manager_name
      FROM vendors v
      JOIN users u ON v.managed_by = u.id
    `);

    // Add simulated metrics
    const report = vendors.map((vendor, idx) => ({
      ...vendor,
      submitted: 10 + (idx * 3),
      joined: 2 + (idx % 3),
      conversion_rate: parseFloat(((2 + (idx % 3)) / (10 + (idx * 3)) * 100).toFixed(1))
    }));

    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate vendor performance report' });
  }
});

// Serve frontend SPA fallback for direct sub-routes (React router)
app.get('*', (req, res) => {
  if (fs.existsSync(clientBuildPath)) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.send('TalentGrade ATS API is running. Client build is not generated yet.');
  }
});

// Init DB and Listen
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TalentGrade ATS Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database initialization failed:', err);
  });
