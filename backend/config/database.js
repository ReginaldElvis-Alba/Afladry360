const mysql = require('mysql2/promise');
require('dotenv').config(); // This will automatically load .env file

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, // This will come from .env file
    database: process.env.DB_NAME || 'afla_dry_360',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
};

// Create connection pool
let pool;

// Initialize database connection
const connectDB = async () => {
    try {
        // Connect to the existing database
        pool = mysql.createPool(dbConfig);
        
        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ MySQL connection established to existing database');
        
        // Verify tables exist (don't create them)
        await verifyTables(connection);
        
        connection.release();
        return pool;
        
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

// Verify that required tables exist
const verifyTables = async (connection) => {
    try {
        // Check if required tables exist
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('users', 'user_sessions', 'form_data', 'sensor_nodes', 'sensor_readings', 'token_transactions', 'user_tokens')
        `, [process.env.DB_NAME || 'afla_dry_360']);
        
        if (tables.length >= 7) {
            console.log('✅ All required tables found in database');
        } else {
            console.log('⚠️  Some tables may be missing. Found:', tables.map(t => t.TABLE_NAME));
        }
        
    } catch (error) {
        console.error('❌ Error verifying tables:', error);
        throw error;
    }
};

// Get database connection
const getConnection = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return pool;
};

// Close database connection
const closeDB = async () => {
    if (pool) {
        await pool.end();
        console.log('✅ Database connection closed');
    }
};

module.exports = {
    connectDB,
    getConnection,
    closeDB
};
