const { pool } = require('./database');

async function initializeDatabase() {
    try {
        // Create KodUser table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS KodUser (
        uid VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 100000.00,
        phone VARCHAR(20),
        role ENUM('Customer', 'Manager', 'Admin') DEFAULT 'Customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('KodUser table created successfully!');

        // Create UserToken table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS UserToken (
        tid VARCHAR(50) PRIMARY KEY,
        token TEXT NOT NULL,
        uid VARCHAR(50) NOT NULL,
        expiry DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES KodUser(uid) ON DELETE CASCADE
      )
    `);
        console.log('UserToken table created successfully!');

        console.log('Database initialization completed!');
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        return false;
    }
}

module.exports = { initializeDatabase };
