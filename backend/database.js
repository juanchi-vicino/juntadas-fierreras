const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al conectar con SQLite:', err.message);
    else console.log('Conectado a la base de datos SQLite.');
});

// Crear tablas si no existen
db.serialize(() => {
    // Tabla Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profilePic TEXT,
        role TEXT DEFAULT 'user'
    )`);

    // Tabla Juntadas
    db.run(`CREATE TABLE IF NOT EXISTS meets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        image TEXT
    )`);

    // Tabla Asistencias
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meet_id INTEGER,
        user_id INTEGER,
        status TEXT NOT NULL, -- 'SI' o 'NO'
        reason TEXT,
        FOREIGN KEY(meet_id) REFERENCES meets(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

module.exports = db;