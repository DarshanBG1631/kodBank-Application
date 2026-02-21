const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { db, JWT_SECRET, initializeDatabase, runQuery, getOne, getAll } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to generate unique ID
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== ROUTES ====================

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/userdashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ==================== AUTH ROUTES ====================

// Registration Endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { uid, username, password, email, phone, role } = req.body;

        // Validate required fields
        if (!uid || !username || !password || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Enforce Customer role only
        const userRole = 'Customer';

        // Check if username or email already exists
        const existingUser = await getOne(
            'SELECT username, email FROM KodUser WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user with default balance of 100000
        await runQuery(
            'INSERT INTO KodUser (uid, username, email, password, balance, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uid, username, email, hashedPassword, 100000, phone, userRole]
        );

        console.log(`User registered: ${username}, Role: ${userRole}, Balance: 100000`);

        res.json({
            success: true,
            message: 'Registration successful! Redirecting to login...',
            redirect: '/login'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user by username
        const user = await getOne(
            'SELECT uid, username, password, role FROM KodUser WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                username: user.username,
                role: user.role,
                uid: user.uid
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store token in database
        const tokenId = generateId('token');
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1); // 1 hour expiry

        await runQuery(
            'INSERT INTO UserToken (tid, token, uid, expiry) VALUES (?, ?, ?, ?)',
            [tokenId, token, user.uid, expiryDate.toISOString()]
        );

        console.log(`User logged in: ${username}, Token generated`);

        // Send token in cookie and response
        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 3600000, // 1 hour
            sameSite: 'lax'
        });

        res.json({
            success: true,
            message: 'Login successful!',
            token: token,
            redirect: '/userdashboard'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Check Balance Endpoint (Protected)
app.get('/api/check-balance', async (req, res) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login first.'
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }

        // Check if token exists in database and is not expired
        const tokenRecord = await getOne(
            'SELECT expiry FROM UserToken WHERE token = ? AND uid = ?',
            [token, decoded.uid]
        );

        if (!tokenRecord) {
            return res.status(401).json({
                success: false,
                message: 'Token not found. Please login again.'
            });
        }

        const tokenExpiry = new Date(tokenRecord.expiry);
        if (tokenExpiry < new Date()) {
            // Delete expired token
            await runQuery('DELETE FROM UserToken WHERE token = ?', [token]);
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        }

        // Fetch user balance
        const user = await getOne(
            'SELECT balance FROM KodUser WHERE username = ?',
            [decoded.username]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const balance = user.balance;

        console.log(`Balance checked for: ${decoded.username}, Balance: ${balance}`);

        res.json({
            success: true,
            balance: balance,
            username: decoded.username
        });

    } catch (error) {
        console.error('Check balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance. Please try again.'
        });
    }
});

// Logout Endpoint
app.post('/api/logout', async (req, res) => {
    try {
        const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            // Delete token from database
            await runQuery('DELETE FROM UserToken WHERE token = ?', [token]);
        }

        // Clear cookie
        res.clearCookie('authToken');

        res.json({
            success: true,
            message: 'Logout successful!',
            redirect: '/login'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed. Please try again.'
        });
    }
});

// Start server
async function startServer() {
    try {
        // Initialize database tables
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Kodbank server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
