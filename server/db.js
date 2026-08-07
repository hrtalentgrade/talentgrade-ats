import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.startsWith('postgres://') || 
  process.env.DATABASE_URL.startsWith('postgresql://')
);

function parseConnectionString(uri) {
  try {
    const prefix = uri.startsWith('postgresql://') ? 'postgresql://' : 'postgres://';
    const rest = uri.substring(prefix.length);
    
    const atIndex = rest.lastIndexOf('@');
    if (atIndex === -1) return null;
    
    const userPass = rest.substring(0, atIndex);
    const hostDb = rest.substring(atIndex + 1);
    
    const colonIndex = userPass.indexOf(':');
    if (colonIndex === -1) return null;
    
    const user = decodeURIComponent(userPass.substring(0, colonIndex));
    const password = decodeURIComponent(userPass.substring(colonIndex + 1));
    
    const slashIndex = hostDb.indexOf('/');
    if (slashIndex === -1) return null;
    
    const hostPort = hostDb.substring(0, slashIndex);
    const dbOptions = hostDb.substring(slashIndex + 1);
    
    const dbName = dbOptions.split('?')[0];
    
    let host = hostPort;
    let port = 5432;
    const hostColon = hostPort.indexOf(':');
    if (hostColon !== -1) {
      host = hostPort.substring(0, hostColon);
      port = parseInt(hostPort.substring(hostColon + 1)) || 5432;
    }
    
    return { user, password, host, port, database: dbName };
  } catch (e) {
    return null;
  }
}

let dbSqlite = null;
let dbPostgresPool = null;

if (isPostgres) {
  console.log('Connecting to PostgreSQL database...');
  const parsed = parseConnectionString(process.env.DATABASE_URL);
  if (parsed) {
    console.log(`Parsed PG Config - Host: ${parsed.host}, Port: ${parsed.port}, DB: ${parsed.database}, User: ${parsed.user}`);
    dbPostgresPool = new Pool({
      user: parsed.user,
      password: parsed.password,
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } else {
    dbPostgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
} else {
  console.log('Connecting to SQLite database...');
  const dbPath = path.resolve(__dirname, 'talentgrade.db');
  dbSqlite = new sqlite3.Database(dbPath);
  dbSqlite.serialize(() => {
    dbSqlite.run('PRAGMA foreign_keys = ON;');
  });
}

function translateQuery(sql, params) {
  if (!isPostgres) return { sql, params };
  
  let translatedSql = sql;
  
  // 1. Replace ? placeholders with $1, $2, $3...
  let index = 1;
  translatedSql = translatedSql.replace(/\?/g, () => `$${index++}`);
  
  // 2. Append RETURNING id to INSERT statements to get lastID
  let trimmed = translatedSql.trim().toUpperCase();
  if (trimmed.startsWith('INSERT') && !trimmed.includes('RETURNING')) {
    translatedSql += ' RETURNING id';
  }
  
  return { sql: translatedSql, params };
}

export const run = (sql, params = []) => {
  if (isPostgres) {
    const t = translateQuery(sql, params);
    return new Promise((resolve, reject) => {
      dbPostgresPool.query(t.sql, t.params, (err, res) => {
        if (err) {
          console.error('PG Run Error:', err, 'SQL:', t.sql);
          reject(err);
        } else {
          resolve({ id: res.rows[0]?.id || null, changes: res.rowCount });
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      dbSqlite.run(sql, params, function (err) {
        if (err) {
          console.error('DB Run Error:', err, 'SQL:', sql);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

export const get = (sql, params = []) => {
  if (isPostgres) {
    const t = translateQuery(sql, params);
    return new Promise((resolve, reject) => {
      dbPostgresPool.query(t.sql, t.params, (err, res) => {
        if (err) {
          console.error('PG Get Error:', err, 'SQL:', t.sql);
          reject(err);
        } else {
          resolve(res.rows[0] || null);
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      dbSqlite.get(sql, params, (err, row) => {
        if (err) {
          console.error('DB Get Error:', err, 'SQL:', sql);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};

export const all = (sql, params = []) => {
  if (isPostgres) {
    const t = translateQuery(sql, params);
    return new Promise((resolve, reject) => {
      dbPostgresPool.query(t.sql, t.params, (err, res) => {
        if (err) {
          console.error('PG All Error:', err, 'SQL:', t.sql);
          reject(err);
        } else {
          resolve(res.rows);
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      dbSqlite.all(sql, params, (err, rows) => {
        if (err) {
          console.error('DB All Error:', err, 'SQL:', sql);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
};

export const initDb = async () => {
  if (isPostgres) {
    console.log('Initializing PostgreSQL Database...');

    // 1. Teams Table
    await run(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        leader_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Users Table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) CHECK(role IN ('Super Admin', 'Team Leader', 'Recruiter')) NOT NULL,
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Link leader_id in teams to users via foreign key
    try {
      await run(`ALTER TABLE teams ADD CONSTRAINT fk_teams_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL`);
    } catch (e) {
      // Ignored if constraint already exists
    }

    // Ensure punch_in_selfie_path is TEXT for base64 storage support
    try {
      await run(`ALTER TABLE attendance ALTER COLUMN punch_in_selfie_path TYPE TEXT`);
    } catch (e) {
      // Ignored if column type is already text or if sqlite
    }

    // 3. Vacancies Table
    await run(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        target_profiles TEXT,
        priority VARCHAR(50) CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
        deadline TIMESTAMP NOT NULL,
        status VARCHAR(50) CHECK(status IN ('Open', 'Hold', 'Closed')) DEFAULT 'Open',
        remarks TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        jd_raw_text TEXT,
        jd_file_path VARCHAR(255),
        jd_analysis TEXT,
        jd_screening_questions TEXT,
        jd_eligibility_checklist TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Vacancy Assignments Table
    await run(`
      CREATE TABLE IF NOT EXISTS vacancy_assignments (
        id SERIAL PRIMARY KEY,
        vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vacancy_id, assigned_to)
      )
    `);

    // 5. Candidates Table
    await run(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL UNIQUE,
        nationality VARCHAR(100),
        location VARCHAR(255),
        experience_years INTEGER DEFAULT 0,
        skills TEXT,
        current_salary REAL,
        expected_salary REAL,
        notice_period_days INTEGER DEFAULT 30,
        current_position VARCHAR(255),
        resume_path VARCHAR(255),
        vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE SET NULL,
        pipeline_status VARCHAR(50) CHECK(pipeline_status IN (
          'New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'
        )) DEFAULT 'New',
        assigned_recruiter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Candidate Timeline Table
    await run(`
      CREATE TABLE IF NOT EXISTS candidate_timeline (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        action_type VARCHAR(255) NOT NULL,
        details TEXT,
        performed_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Attendance Table
    await run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        punch_in_time TIMESTAMP NOT NULL,
        punch_out_time TIMESTAMP,
        punch_in_selfie_path TEXT,
        punch_in_ip VARCHAR(50),
        punch_in_browser VARCHAR(255),
        punch_in_device VARCHAR(255),
        punch_in_location TEXT,
        punch_out_location TEXT,
        working_hours REAL DEFAULT 0,
        is_late INTEGER DEFAULT 0,
        overtime_hours REAL DEFAULT 0,
        UNIQUE(user_id, attendance_date)
      )
    `);

    // 8. Tasks Table
    await run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_sourcing_count INTEGER DEFAULT 5,
        target_submissions_count INTEGER DEFAULT 0,
        status VARCHAR(50) CHECK(status IN ('Assigned', 'In Progress', 'Submitted', 'Completed', 'Overdue', 'Cancelled')) DEFAULT 'Assigned',
        deadline TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Task Comments Table
    await run(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        attachment_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Vendors Table
    await run(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        poc_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        email VARCHAR(255) NOT NULL UNIQUE,
        countries TEXT,
        specialization TEXT,
        remarks TEXT,
        managed_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Activity Logs Table
    await run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. Notifications Table
    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. Screenings Table
    await run(`
      CREATE TABLE IF NOT EXISTS screenings (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
        recruiter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        answers TEXT,
        follow_up_questions TEXT,
        ai_match_scores TEXT,
        missing_info TEXT,
        recruiter_notes TEXT,
        recruiter_recommendation VARCHAR(50) CHECK(recruiter_recommendation IN ('Recommended', 'Maybe', 'Not Suitable')) NOT NULL,
        ai_reasoning TEXT,
        is_approved_by_tl INTEGER DEFAULT 0,
        tl_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        tl_approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, vacancy_id)
      )
    `);

    // Create Indexes
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
    if (parseInt(teamCount.count) === 0) {
      console.log('Seeding initial teams (Team A, Team B)...');
      await run(`INSERT INTO teams (name) VALUES ('Team A')`);
      await run(`INSERT INTO teams (name) VALUES ('Team B')`);
    }

    // Seed default users
    const userCount = await get(`SELECT COUNT(*) as count FROM users`);
    if (parseInt(userCount.count) === 0) {
      console.log('Seeding default enterprise users for PostgreSQL...');
      const teams = await all(`SELECT id, name FROM teams`);
      const teamAId = teams.find(t => t.name === 'Team A')?.id || null;

      // Super Admin: admin@tgats.com / TG1001 / admin@123
      const hashAdmin = bcrypt.hashSync('admin@123', 10);
      await run(`
        INSERT INTO users (employee_id, email, password_hash, full_name, role)
        VALUES ('TG1001', 'admin@tgats.com', ?, 'Super Admin User', 'Super Admin')
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

      console.log('PostgreSQL seeding completed successfully.');
    } else {
      console.log('PostgreSQL Database already has users. Seeding skipped.');
    }

    console.log('PostgreSQL DB initialization complete.');
    return;
  }

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
      vacancy_id INTEGER,
      pipeline_status TEXT CHECK(pipeline_status IN (
        'New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'
      )) DEFAULT 'New',
      assigned_recruiter_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE SET NULL,
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
      punch_in_selfie_path TEXT,
      punch_in_ip TEXT,
      punch_in_browser TEXT,
      punch_in_device TEXT,
      punch_in_location TEXT,
      punch_out_location TEXT,
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

  // Migration for attendance table columns
  const attTableInfo = await all("PRAGMA table_info(attendance)");
  const attColNames = attTableInfo.map(c => c.name);
  if (!attColNames.includes('punch_in_location')) {
    console.log('Migrating attendance table schema for Location details...');
    await run('ALTER TABLE attendance ADD COLUMN punch_in_location TEXT');
    await run('ALTER TABLE attendance ADD COLUMN punch_out_location TEXT');
  }

  // Migration to make vacancy_id nullable in candidates table
  const candidatesTableInfo = await all("PRAGMA table_info(candidates)");
  const vacancyIdCol = candidatesTableInfo.find(c => c.name === 'vacancy_id');
  if (vacancyIdCol && vacancyIdCol.notnull === 1) {
    console.log('Migrating candidates table schema: Making vacancy_id nullable...');
    
    // Disable foreign keys temporarily
    await run('PRAGMA foreign_keys = OFF');
    
    // Rename old table
    await run('ALTER TABLE candidates RENAME TO candidates_old');
    
    // Create new candidates table with vacancy_id nullable
    await run(`
      CREATE TABLE candidates (
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
        vacancy_id INTEGER,
        pipeline_status TEXT CHECK(pipeline_status IN (
          'New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'
        )) DEFAULT 'New',
        assigned_recruiter_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_recruiter_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Copy data from candidates_old
    await run(`
      INSERT INTO candidates (
        id, name, email, phone, nationality, location, experience_years, skills,
        current_salary, expected_salary, notice_period_days, current_position,
        resume_path, vacancy_id, pipeline_status, assigned_recruiter_id, created_at
      )
      SELECT 
        id, name, email, phone, nationality, location, experience_years, skills,
        current_salary, expected_salary, notice_period_days, current_position,
        resume_path, vacancy_id, pipeline_status, assigned_recruiter_id, created_at
      FROM candidates_old
    `);
    
    // Drop old table
    await run('DROP TABLE candidates_old');
    
    // Re-enable foreign keys
    await run('PRAGMA foreign_keys = ON');
    console.log('Candidates vacancy_id nullable migration complete.');
  }

  // Fix foreign keys for tables referencing candidates (in case candidates_old rename broke them)
  try {
    const timelineTableInfo = await all("PRAGMA foreign_key_list(candidate_timeline)");
    const hasOldTimelineRef = timelineTableInfo.some(fk => fk.table === 'candidates_old');
    if (hasOldTimelineRef) {
      console.log('Rebuilding candidate_timeline foreign key reference...');
      await run('PRAGMA foreign_keys = OFF');
      await run('ALTER TABLE candidate_timeline RENAME TO candidate_timeline_old');
      await run(`
        CREATE TABLE candidate_timeline (
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
      await run(`
        INSERT INTO candidate_timeline (id, candidate_id, action_type, details, performed_by, created_at)
        SELECT id, candidate_id, action_type, details, performed_by, created_at FROM candidate_timeline_old
      `);
      await run('DROP TABLE candidate_timeline_old');
      await run('PRAGMA foreign_keys = ON');
      console.log('candidate_timeline rebuilt.');
    }
  } catch (err) {
    console.error('Error rebuilding timeline foreign keys:', err);
  }

  try {
    // Recovery/Rebuild for screenings table
    const screeningsOldExists = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='screenings_old'");
    if (screeningsOldExists) {
      console.log('Recovering and rebuilding screenings table from screenings_old...');
      await run('PRAGMA foreign_keys = OFF');
      await run('DROP TABLE IF EXISTS screenings');
      await run(`
        CREATE TABLE screenings (
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
          FOREIGN KEY (tl_approved_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      await run(`
        INSERT INTO screenings (
          id, candidate_id, vacancy_id, recruiter_id, answers, follow_up_questions,
          ai_match_scores, missing_info, recruiter_notes, recruiter_recommendation,
          ai_reasoning, is_approved_by_tl, tl_approved_by, tl_approved_at, created_at
        )
        SELECT 
          id, candidate_id, vacancy_id, recruiter_id, answers, follow_up_questions,
          ai_match_scores, missing_info, recruiter_notes, recruiter_recommendation,
          ai_reasoning, is_approved_by_tl, tl_approved_by, tl_approved_at, created_at
        FROM screenings_old
      `);
      await run('DROP TABLE screenings_old');
      await run('PRAGMA foreign_keys = ON');
      console.log('screenings table successfully recovered and rebuilt.');
    } else {
      // Normal migration check (if table was not already renamed)
      const screeningsTableInfo = await all("PRAGMA foreign_key_list(screenings)");
      const hasOldScreeningsRef = screeningsTableInfo.some(fk => fk.table === 'candidates_old');
      if (hasOldScreeningsRef) {
        console.log('Rebuilding screenings foreign key reference...');
        await run('PRAGMA foreign_keys = OFF');
        await run('ALTER TABLE screenings RENAME TO screenings_old');
        await run(`
          CREATE TABLE screenings (
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
            FOREIGN KEY (tl_approved_by) REFERENCES users(id) ON DELETE SET NULL
          )
        `);
        await run(`
          INSERT INTO screenings (
            id, candidate_id, vacancy_id, recruiter_id, answers, follow_up_questions,
            ai_match_scores, missing_info, recruiter_notes, recruiter_recommendation,
            ai_reasoning, is_approved_by_tl, tl_approved_by, tl_approved_at, created_at
          )
          SELECT 
            id, candidate_id, vacancy_id, recruiter_id, answers, follow_up_questions,
            ai_match_scores, missing_info, recruiter_notes, recruiter_recommendation,
            ai_reasoning, is_approved_by_tl, tl_approved_by, tl_approved_at, created_at
          FROM screenings_old
        `);
        await run('DROP TABLE screenings_old');
        await run('PRAGMA foreign_keys = ON');
        console.log('screenings rebuilt.');
      }
    }
  } catch (err) {
    console.error('Error rebuilding screenings foreign keys:', err);
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
