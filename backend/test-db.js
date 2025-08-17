const mysql = require('mysql2/promise');
require('dotenv').config(); // This will automatically load .env file

async function testConnection() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'afla_dry_360',
        port: parseInt(process.env.DB_PORT) || 3306
    };

    console.log('Testing database connection with config:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
    });

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful!');
        
        // Test query to see tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Available tables:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
        
        // Test users table structure
        try {
            const [columns] = await connection.execute('DESCRIBE users');
            console.log('\n👥 Users table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
            });
        } catch (err) {
            console.log('⚠️  Could not describe users table:', err.message);
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check your password in .env file');
        console.log('3. Verify the database name exists');
        console.log('4. Ensure the user has proper permissions');
    }
}

testConnection();
