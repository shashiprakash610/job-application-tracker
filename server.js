const express = require('express');
const multer = require('multer');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const DB_PATH = path.join(__dirname, 'applications.db');
let db;

// Save database to disk periodically
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, and RTF files are allowed'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_description TEXT,
      job_url TEXT,
      application_date TEXT NOT NULL,
      status TEXT DEFAULT 'applied',
      interview_date TEXT,
      notes TEXT,
      cv_filename TEXT,
      cv_original_name TEXT,
      motivation_letter_filename TEXT,
      motivation_letter_original_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  saveDatabase();
}

// Helper: run a query and get all results as objects
function dbAll(query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run a query and get first result as object
function dbGet(query, params = []) {
  const results = dbAll(query, params);
  return results.length > 0 ? results[0] : null;
}

// Helper: run a statement (INSERT, UPDATE, DELETE)
function dbRun(query, params = []) {
  db.run(query, params);
  saveDatabase();
}

// API Routes

// Get all applications
app.get('/api/applications', (req, res) => {
  const { status, search, sort } = req.query;
  let query = 'SELECT * FROM applications WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (company_name LIKE ? OR job_title LIKE ? OR job_description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (sort === 'oldest') {
    query += ' ORDER BY application_date ASC';
  } else if (sort === 'company') {
    query += ' ORDER BY company_name ASC';
  } else {
    query += ' ORDER BY application_date DESC';
  }

  const applications = dbAll(query, params);
  res.json(applications);
});

// Get single application
app.get('/api/applications/:id', (req, res) => {
  const application = dbGet('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json(application);
});

// Create application
app.post('/api/applications', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'motivation_letter', maxCount: 1 }
]), (req, res) => {
  try {
    const id = uuidv4();
    const { company_name, job_title, job_description, job_url, application_date, notes } = req.body;

    const cvFile = req.files?.cv?.[0];
    const mlFile = req.files?.motivation_letter?.[0];

    dbRun(`
      INSERT INTO applications (id, company_name, job_title, job_description, job_url, application_date, notes,
        cv_filename, cv_original_name, motivation_letter_filename, motivation_letter_original_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, company_name, job_title, job_description || null, job_url || null,
      application_date, notes || null,
      cvFile?.filename || null, cvFile?.originalname || null,
      mlFile?.filename || null, mlFile?.originalname || null
    ]);

    const application = dbGet('SELECT * FROM applications WHERE id = ?', [id]);
    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application status
app.patch('/api/applications/:id', (req, res) => {
  const { status, interview_date, notes } = req.body;
  const application = dbGet('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (interview_date !== undefined) { updates.push('interview_date = ?'); params.push(interview_date || null); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  updates.push("updated_at = datetime('now')");

  if (updates.length > 1) {
    const query = `UPDATE applications SET ${updates.join(', ')} WHERE id = ?`;
    params.push(req.params.id);
    dbRun(query, params);
  }

  const updated = dbGet('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  res.json(updated);
});

// Delete application
app.delete('/api/applications/:id', (req, res) => {
  const application = dbGet('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  // Delete uploaded files
  if (application.cv_filename) {
    const cvPath = path.join(uploadsDir, application.cv_filename);
    if (fs.existsSync(cvPath)) fs.unlinkSync(cvPath);
  }
  if (application.motivation_letter_filename) {
    const mlPath = path.join(uploadsDir, application.motivation_letter_filename);
    if (fs.existsSync(mlPath)) fs.unlinkSync(mlPath);
  }

  dbRun('DELETE FROM applications WHERE id = ?', [req.params.id]);
  res.json({ message: 'Application deleted' });
});

// Get stats
app.get('/api/stats', (req, res) => {
  const total = dbGet('SELECT COUNT(*) as count FROM applications').count;
  const interviewed = dbGet("SELECT COUNT(*) as count FROM applications WHERE status = 'interview'").count;
  const offered = dbGet("SELECT COUNT(*) as count FROM applications WHERE status = 'offered'").count;
  const rejected = dbGet("SELECT COUNT(*) as count FROM applications WHERE status = 'rejected'").count;
  const applied = dbGet("SELECT COUNT(*) as count FROM applications WHERE status = 'applied'").count;

  res.json({ total, applied, interviewed, offered, rejected });
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Start server after DB is ready
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Job Application Tracker running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
