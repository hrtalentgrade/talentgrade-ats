import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'talentgrade.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
});

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('DB Run Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('DB Get Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('DB All Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const initDb = async () => {
  console.log('Initializing SQLite Database...');

  // 1. Teams Table
  await run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      leader_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Users Table (with FK to teams)
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('Super Admin', 'Team Leader', 'Recruiter')) NOT NULL,
      team_id INTEGER,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Update Teams table to link leader_id to users
  // Note: SQLite doesn't easily support adding constraints after table creation without rebuilds.
  // We'll manage leader referencing at application level, or ensure team constraints are clear.

  // 3. Vacancies Table
  await run(`
    CREATE TABLE IF NOT EXISTS vacancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target_profiles TEXT,
      priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
      deadline DATETIME NOT NULL,
      status TEXT CHECK(status IN ('Open', 'Hold', 'Closed')) DEFAULT 'Open',
      remarks TEXT,
      created_by INTEGER NOT NULL,
      jd_raw_text TEXT,
      jd_file_path TEXT,
      jd_analysis TEXT,
      jd_screening_questions TEXT,
      jd_eligibility_checklist TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 4. Vacancy Assignments Table
  await run(`
    CREATE TABLE IF NOT EXISTS vacancy_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vacancy_id INTEGER NOT NULL,
      assigned_to INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(vacancy_id, assigned_to)
    )
  `);

  // 5. Candidates Table
  await run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      nationality TEXT,
      location TEXT,
      experience_years INTEGER DEFAULT 0,
      skills TEXT,
      current_salary REAL,
      expected_salary REAL,
      notice_period_days INTEGER DEFAULT 30,
      current_position TEXT,
      resume_path TEXT,
      vacancy_id INTEGER NOT NULL,
      pipeline_status TEXT CHECK(pipeline_status IN (
        'New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'
      )) DEFAULT 'New',
      assigned_recruiter_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_recruiter_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 6. Candidate Timeline Table
  await run(`
    CREATE TABLE IF NOT EXISTS candidate_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      details TEXT,
      performed_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 7. Attendance Table
  await run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      attendance_date DATE NOT NULL,
      punch_in_time DATETIME NOT NULL,
      punch_out_time DATETIME,
      punch_in_selfie_path TEXT NOT NULL,
      punch_in_ip TEXT,
      punch_in_browser TEXT,
      punch_in_device TEXT,
      working_hours REAL DEFAULT 0,
      is_late INTEGER DEFAULT 0, -- Boolean 0 or 1
      overtime_hours REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, attendance_date)
    )
  `);

  // 8. Tasks Table
  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vacancy_id INTEGER NOT NULL,
      assigned_to INTEGER NOT NULL,
      team_id INTEGER,
      parent_task_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      target_sourcing_count INTEGER DEFAULT 5,
      target_submissions_count INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('Assigned', 'In Progress', 'Submitted', 'Completed', 'Overdue', 'Cancelled')) DEFAULT 'Assigned',
      deadline DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 9. Task Comments Table
  await run(`
    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      attachment_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 10. Vendors Table
  await run(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      poc_name TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      email TEXT NOT NULL UNIQUE,
      countries TEXT,
      specialization TEXT,
      remarks TEXT,
      managed_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 11. Activity Logs Table
  await run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 12. Notifications Table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0, -- 0 for false, 1 for true
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 13. Screenings Table (for AI Vacancy Screening)
  await run(`
    CREATE TABLE IF NOT EXISTS screenings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      vacancy_id INTEGER NOT NULL,
      recruiter_id INTEGER NOT NULL,
      answers TEXT,
      follow_up_questions TEXT,
      ai_match_scores TEXT,
      missing_info TEXT,
      recruiter_notes TEXT,
      recruiter_recommendation TEXT CHECK(recruiter_recommendation IN ('Recommended', 'Maybe', 'Not Suitable')) NOT NULL,
      ai_reasoning TEXT,
      is_approved_by_tl INTEGER DEFAULT 0,
      tl_approved_by INTEGER,
      tl_approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE,
      FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tl_approved_by) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(candidate_id, vacancy_id)
    )
  `);

  // Migration for vacancies table columns in case they exist
  const tableInfo = await all("PRAGMA table_info(vacancies)");
  const colNames = tableInfo.map(c => c.name);
  if (!colNames.includes('jd_raw_text')) {
    console.log('Migrating vacancies table schema for AI Intelligence...');
    await run('ALTER TABLE vacancies ADD COLUMN jd_raw_text TEXT');
    await run('ALTER TABLE vacancies ADD COLUMN jd_file_path TEXT');
    await run('ALTER TABLE vacancies ADD COLUMN jd_analysis TEXT');
    await run('ALTER TABLE vacancies ADD COLUMN jd_screening_questions TEXT');
    await run('ALTER TABLE vacancies ADD COLUMN jd_eligibility_checklist TEXT');
  }

  // Migration for tasks table columns
  const taskTableInfo = await all("PRAGMA table_info(tasks)");
  const taskColNames = taskTableInfo.map(c => c.name);
  if (!taskColNames.includes('team_id')) {
    console.log('Migrating tasks table schema for Team Quotas...');
    await run('ALTER TABLE tasks ADD COLUMN team_id INTEGER');
    await run('ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER');
    await run('ALTER TABLE tasks ADD COLUMN target_submissions_count INTEGER DEFAULT 0');
  }

  // Index setup
  await run(`CREATE INDEX IF NOT EXISTS idx_users_emp ON users(employee_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_candidates_vacancy ON candidates(vacancy_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)`);

  // Seed default teams
  const teamCount = await get(`SELECT COUNT(*) as count FROM teams`);
  if (teamCount.count === 0) {
    console.log('Seeding initial teams (Team A, Team B)...');
    await run(`INSERT INTO teams (name) VALUES ('Team A')`);
    await run(`INSERT INTO teams (name) VALUES ('Team B')`);
  }

  // Seed default users
  const userCount = await get(`SELECT COUNT(*) as count FROM users`);
  if (userCount.count === 0) {
    console.log('Seeding default enterprise users...');
    const teams = await all(`SELECT id, name FROM teams`);
    const teamAId = teams.find(t => t.name === 'Team A')?.id || null;
    const teamBId = teams.find(t => t.name === 'Team B')?.id || null;

    // Super Admin: admin@tgats.com / TG1001 / admin@123
    const hashAdmin = bcrypt.hashSync('admin@123', 10);
    await run(`
      INSERT INTO users (employee_id, email, password_hash, full_name, role, team_id)
      VALUES ('TG1001', 'admin@tgats.com', ?, 'Super Admin User', 'Super Admin', NULL)
    `, [hashAdmin]);

    // Team Leader: tl1@tgats.com / TG1002 / tl@123 (assigned to Team A)
    const hashTL = bcrypt.hashSync('tl@123', 10);
    const tlResult = await run(`
      INSERT INTO users (employee_id, email, password_hash, full_name, role, team_id)
      VALUES ('TG1002', 'tl1@tgats.com', ?, 'Team Leader A', 'Team Leader', ?)
    `, [hashTL, teamAId]);

    // Update Team A's leader
    await run(`UPDATE teams SET leader_id = ? WHERE id = ?`, [tlResult.id, teamAId]);

    // Recruiter: recruiter1@tgats.com / TG1003 / recruiter@123 (assigned to Team A)
    const hashRecruiter = bcrypt.hashSync('recruiter@123', 10);
    await run(`
      INSERT INTO users (employee_id, email, password_hash, full_name, role, team_id)
      VALUES ('TG1003', 'recruiter1@tgats.com', ?, 'Recruiter One', 'Recruiter', ?)
    `, [hashRecruiter, teamAId]);

    console.log('Seeding completed successfully.');
  } else {
    console.log('Database already has users. Seeding skipped.');
  }
};
