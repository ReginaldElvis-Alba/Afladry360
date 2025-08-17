const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const connection = await getConnection();
        
        // Check if session is valid
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

        req.user = decoded;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }
        
        console.error('Token verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Validation middleware
const validateFarmData = [
    body('temperature')
        .optional()
        .isFloat({ min: -50, max: 100 })
        .withMessage('Temperature must be between -50°C and 100°C'),
    body('humidity')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Humidity must be between 0% and 100%'),
    body('moisture')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Moisture must be between 0% and 100%'),
    body('aflatoxin_level')
        .optional()
        .isFloat({ min: 0, max: 1000 })
        .withMessage('Aflatoxin level must be between 0 and 1000 ppb'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters')
];

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const connection = await getConnection();
        
        const [users] = await connection.execute(
            `SELECT id, username, email, full_name, phone, location, farm_size, user_type, 
                    is_verified, created_at, updated_at 
             FROM users WHERE id = ?`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
    body('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),
    body('farm_size')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Farm size must be a positive number')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { full_name, phone, location, farm_size } = req.body;
        const connection = await getConnection();

        // Update user profile
        const [result] = await connection.execute(
            `UPDATE users 
             SET full_name = COALESCE(?, full_name), 
                 phone = COALESCE(?, phone), 
                 location = COALESCE(?, location), 
                 farm_size = COALESCE(?, farm_size),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [full_name, phone, location, farm_size, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Get updated user data
        const [users] = await connection.execute(
            `SELECT id, username, email, full_name, phone, location, farm_size, user_type, 
                    is_verified, created_at, updated_at 
             FROM users WHERE id = ?`,
            [req.user.userId]
        );

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   POST /api/users/farm-data
// @desc    Add farm data (sensor readings)
// @access  Private
router.post('/farm-data', authenticateToken, validateFarmData, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { temperature, humidity, moisture, aflatoxin_level, location, notes } = req.body;
        const connection = await getConnection();

        // Insert farm data
        const [result] = await connection.execute(
            `INSERT INTO farm_data (user_id, temperature, humidity, moisture, aflatoxin_level, location, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.userId, temperature, humidity, moisture, aflatoxin_level, location, notes]
        );

        const dataId = result.insertId;

        // Get inserted data
        const [data] = await connection.execute(
            'SELECT * FROM farm_data WHERE id = ?',
            [dataId]
        );

        res.status(201).json({
            status: 'success',
            message: 'Farm data recorded successfully',
            data: {
                farm_data: data[0]
            }
        });

    } catch (error) {
        console.error('Add farm data error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/users/farm-data
// @desc    Get user's farm data
// @access  Private
router.get('/farm-data', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;
        
        const connection = await getConnection();
        
        let whereClause = 'WHERE user_id = ?';
        let params = [req.user.userId];
        
        if (start_date && end_date) {
            whereClause += ' AND reading_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // Get total count
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM farm_data ${whereClause}`,
            params
        );
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get farm data with pagination
        const [data] = await connection.execute(
            `SELECT * FROM farm_data ${whereClause} 
             ORDER BY reading_date DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.status(200).json({
            status: 'success',
            data: {
                farm_data: data,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_records: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get farm data error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/users/farm-data/:id
// @desc    Get specific farm data entry
// @access  Private
router.get('/farm-data/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        
        const [data] = await connection.execute(
            'SELECT * FROM farm_data WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Farm data not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                farm_data: data[0]
            }
        });

    } catch (error) {
        console.error('Get farm data error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   PUT /api/users/farm-data/:id
// @desc    Update farm data entry
// @access  Private
router.put('/farm-data/:id', authenticateToken, validateFarmData, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { temperature, humidity, moisture, aflatoxin_level, location, notes } = req.body;
        const connection = await getConnection();

        // Check if data exists and belongs to user
        const [existingData] = await connection.execute(
            'SELECT id FROM farm_data WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (existingData.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Farm data not found'
            });
        }

        // Update farm data
        await connection.execute(
            `UPDATE farm_data 
             SET temperature = COALESCE(?, temperature), 
                 humidity = COALESCE(?, humidity), 
                 moisture = COALESCE(?, moisture), 
                 aflatoxin_level = COALESCE(?, aflatoxin_level),
                 location = COALESCE(?, location), 
                 notes = COALESCE(?, notes)
             WHERE id = ? AND user_id = ?`,
            [temperature, humidity, moisture, aflatoxin_level, location, notes, id, req.user.userId]
        );

        // Get updated data
        const [data] = await connection.execute(
            'SELECT * FROM farm_data WHERE id = ?',
            [id]
        );

        res.status(200).json({
            status: 'success',
            message: 'Farm data updated successfully',
            data: {
                farm_data: data[0]
            }
        });

    } catch (error) {
        console.error('Update farm data error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   DELETE /api/users/farm-data/:id
// @desc    Delete farm data entry
// @access  Private
router.delete('/farm-data/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        
        // Check if data exists and belongs to user
        const [existingData] = await connection.execute(
            'SELECT id FROM farm_data WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (existingData.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Farm data not found'
            });
        }

        // Delete farm data
        await connection.execute(
            'DELETE FROM farm_data WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        res.status(200).json({
            status: 'success',
            message: 'Farm data deleted successfully'
        });

    } catch (error) {
        console.error('Delete farm data error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router;

