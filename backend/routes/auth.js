const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

const router = express.Router();

// Validation middleware
const validateSignup = [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateSignin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Helper functions
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

const saveSession = async (userId, token) => {
    const connection = await getConnection();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await connection.execute(
        'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
    );
};

// @route   POST /api/auth/signup
router.post('/signup', validateSignup, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const { username, email, full_name, password } = req.body;
        const connection = await getConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'User with this email or username already exists'
            });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user - try to match your existing table structure
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, full_name, password, created_at) VALUES (?, ?, ?, ?, NOW())',
            [username, email, full_name, hashedPassword]
        );

        // Generate token
        const token = generateToken(result.insertId);

        // Save session
        await saveSession(result.insertId, token);

        // Get the created user (without password)
        const [newUser] = await connection.execute(
            'SELECT id, username, email, full_name, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: newUser[0],
                token: token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error during registration'
        });
    }
});

// @route   POST /api/auth/signin
router.post('/signin', validateSignin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const { email, password } = req.body;
        const connection = await getConnection();

        // Find user by email
        const [users] = await connection.execute(
            'SELECT id, username, email, full_name, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Save session
        await saveSession(user.id, token);

        // Remove password from response
        delete user.password;

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: user,
                token: token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error during login'
        });
    }
});

// @route   POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const connection = await getConnection();
            await connection.execute(
                'DELETE FROM user_sessions WHERE token = ?',
                [token]
            );
        }

        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error during logout'
        });
    }
});

// @route   GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access token required'
            });
        }

        const connection = await getConnection();
        const [sessions] = await connection.execute(
            'SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (sessions.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired token'
            });
        }

        const userId = sessions[0].user_id;
        const [users] = await connection.execute(
            'SELECT id, username, email, full_name, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router;
