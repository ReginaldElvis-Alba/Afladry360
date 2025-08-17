const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access token required'
        });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
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

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

// Validation middleware for sensor data
const validateSensorData = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Sensor name must be 2-100 characters'),
    body('type').isIn(['temperature', 'humidity', 'moisture', 'aflatoxin']).withMessage('Invalid sensor type'),
    body('location').trim().isLength({ min: 2, max: 200 }).withMessage('Location must be 2-200 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// @route   GET /api/sensors
// @desc    Get all sensors for authenticated user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const connection = await getConnection();
        const [sensors] = await connection.execute(
            'SELECT * FROM sensors WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json({
            status: 'success',
            data: {
                sensors: sensors
            }
        });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch sensors'
        });
    }
});

// @route   POST /api/sensors
// @desc    Add new sensor for authenticated user
// @access  Private
router.post('/', authenticateToken, validateSensorData, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const { name, type, location, description } = req.body;
        const connection = await getConnection();

        // Check if sensor name already exists for this user
        const [existing] = await connection.execute(
            'SELECT id FROM sensors WHERE user_id = ? AND name = ?',
            [req.user.id, name]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Sensor with this name already exists'
            });
        }

        // Insert new sensor
        const [result] = await connection.execute(
            'INSERT INTO sensors (user_id, name, type, location, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [req.user.id, name, type, location, description || '', 'active']
        );

        // Fetch the created sensor
        const [newSensor] = await connection.execute(
            'SELECT * FROM sensors WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            status: 'success',
            message: 'Sensor added successfully',
            data: {
                sensor: newSensor[0]
            }
        });
    } catch (error) {
        console.error('Error adding sensor:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add sensor'
        });
    }
});

// @route   GET /api/sensors/:id
// @desc    Get specific sensor by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await getConnection();
        const [sensors] = await connection.execute(
            'SELECT * FROM sensors WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (sensors.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                sensor: sensors[0]
            }
        });
    } catch (error) {
        console.error('Error fetching sensor:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch sensor'
        });
    }
});

// @route   PUT /api/sensors/:id
// @desc    Update sensor by ID
// @access  Private
router.put('/:id', authenticateToken, validateSensorData, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const { name, type, location, description } = req.body;
        const connection = await getConnection();

        // Check if sensor exists and belongs to user
        const [existing] = await connection.execute(
            'SELECT id FROM sensors WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor not found'
            });
        }

        // Check if new name conflicts with other sensors
        const [nameConflict] = await connection.execute(
            'SELECT id FROM sensors WHERE user_id = ? AND name = ? AND id != ?',
            [req.user.id, name, req.params.id]
        );

        if (nameConflict.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Sensor with this name already exists'
            });
        }

        // Update sensor
        await connection.execute(
            'UPDATE sensors SET name = ?, type = ?, location = ?, description = ?, updated_at = NOW() WHERE id = ?',
            [name, type, location, description || '', req.params.id]
        );

        // Fetch updated sensor
        const [updated] = await connection.execute(
            'SELECT * FROM sensors WHERE id = ?',
            [req.params.id]
        );

        res.json({
            status: 'success',
            message: 'Sensor updated successfully',
            data: {
                sensor: updated[0]
            }
        });
    } catch (error) {
        console.error('Error updating sensor:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update sensor'
        });
    }
});

// @route   DELETE /api/sensors/:id
// @desc    Delete sensor by ID
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await getConnection();

        // Check if sensor exists and belongs to user
        const [existing] = await connection.execute(
            'SELECT id FROM sensors WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor not found'
            });
        }

        // Delete sensor
        await connection.execute(
            'DELETE FROM sensors WHERE id = ?',
            [req.params.id]
        );

        res.json({
            status: 'success',
            message: 'Sensor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting sensor:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete sensor'
        });
    }
});

// @route   POST /api/sensors/:id/calibrate
// @desc    Calibrate sensor by ID
// @access  Private
router.post('/:id/calibrate', authenticateToken, async (req, res) => {
    try {
        const connection = await getConnection();

        // Check if sensor exists and belongs to user
        const [existing] = await connection.execute(
            'SELECT id FROM sensors WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor not found'
            });
        }

        // Update sensor calibration status
        await connection.execute(
            'UPDATE sensors SET last_calibrated = NOW(), calibration_status = "calibrated" WHERE id = ?',
            [req.params.id]
        );

        res.json({
            status: 'success',
            message: 'Sensor calibration completed'
        });
    } catch (error) {
        console.error('Error calibrating sensor:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to calibrate sensor'
        });
    }
});

// @route   GET /api/sensors/:id/readings
// @desc    Get sensor readings for specific sensor
// @access  Private
router.get('/:id/readings', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const connection = await getConnection();

        // Check if sensor exists and belongs to user
        const [existing] = await connection.execute(
            'SELECT id FROM sensors WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor not found'
            });
        }

        // Get sensor readings
        const [readings] = await connection.execute(
            'SELECT * FROM sensor_readings WHERE sensor_id = ? ORDER BY reading_date DESC LIMIT ? OFFSET ?',
            [req.params.id, parseInt(limit), parseInt(offset)]
        );

        // Get total count
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM sensor_readings WHERE sensor_id = ?',
            [req.params.id]
        );

        res.json({
            status: 'success',
            data: {
                readings: readings,
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error fetching sensor readings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch sensor readings'
        });
    }
});

module.exports = router;

