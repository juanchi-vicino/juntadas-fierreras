const { Pool } = require('pg');

// Conexión a la base de datos PostgreSQL usando variables de entorno
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Requisito para conexiones en Render/Neon
    }
});

// Función para inicializar las tablas
const initDB = async () => {
    try {
        // Tabla Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                profilePic TEXT,
                role VARCHAR(50) DEFAULT 'user'
            );
        `);

        // Tabla Juntadas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meets (
                id SERIAL PRIMARY KEY,
                place TEXT NOT NULL,
                date TEXT NOT NULL,
                description TEXT,
                image TEXT
            );
        `);

        // Tabla Asistencias
        // Le agregamos ON DELETE CASCADE y UNIQUE para mantener la integridad de los datos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                meet_id INTEGER REFERENCES meets(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(10) NOT NULL,
                reason TEXT,
                UNIQUE(meet_id, user_id)
            );
        `);
        
        console.log('🏁 Conectado a PostgreSQL: Motor de base de datos listo.');
    } catch (err) {
        console.error('Error al inicializar PostgreSQL:', err.message);
    }
};

initDB();

module.exports = pool;