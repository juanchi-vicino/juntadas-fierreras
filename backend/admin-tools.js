// backend/admin-tools.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

db.serialize(() => {
    // 1. Borramos asistencias
    db.run(`DELETE FROM attendance`);
    
    // 2. Borramos juntadas
    db.run(`DELETE FROM meets`);
    
    // 3. Borramos usuarios
    db.run(`DELETE FROM users`);

    // OPCIONAL: Esto resetea los contadores de ID para que el próximo usuario sea el ID 1 otra vez
    db.run(`DELETE FROM sqlite_sequence WHERE name='users'`);
    db.run(`DELETE FROM sqlite_sequence WHERE name='meets'`);
    db.run(`DELETE FROM sqlite_sequence WHERE name='attendance'`);
    
    console.log("🔥 Base de datos reseteada por completo.");
});

db.close();