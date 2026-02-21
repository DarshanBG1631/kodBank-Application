const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite Database Configuration (Local file)
const dbPath = path.join(__dirname, '..', 'kodbank.db');

// JWT Secret Key
const JWT_SECRET = 'Kodbank_Secret_Key_2024_SecureToken';

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('SQLite database connected successfully!');
    }
});

// Initialize database tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create KodUser table
        db.run(`
      CREATE TABLE IF NOT EXISTS KodUser (
        uid TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance REAL DEFAULT 100000.00,
        phone TEXT,
        role TEXT DEFAULT 'Customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
            if (err) {
                console.error('Error creating KodUser table:', err.message);
                reject(err);
                return;
            }
            console.log('KodUser table created successfully!');
        });

        // Create UserToken table
        db.run(`
      CREATE TABLE IF NOT EXISTS UserToken (
        tid TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        uid TEXT NOT NULL,
        expiry DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES KodUser(uid) ON DELETE CASCADE
      )
    `, (err) => {
            if (err) {
                console.error('Error creating UserToken table:', err.message);
                reject(err);
                return;
            }
            console.log('UserToken table created successfully!');
            console.log('Database initialization completed!');
            resolve(true);
        });
    });
}

// Helper function to run queries
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// Helper function to get single row
function getOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Helper function to get all rows
function getAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { db, JWT_SECRET, initializeDatabase, runQuery, getOne, getAll };
