const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Multer para fotos de perfil y juntadas
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

// Registro
app.post('/api/register', upload.single('profilePic'), async (req, res) => {
    const { username, password } = req.body;
    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    if (!profilePic) {
        return res.status(400).json({ error: 'La foto de perfil es obligatoria.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (username, password, profilePic) VALUES (?, ?, ?)`;
        
        db.run(query, [username, hashedPassword, profilePic], function(err) {
            if (err) return res.status(400).json({ error: 'El usuario ya existe.' });
            res.status(201).json({ message: 'Usuario registrado con éxito.', id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Usuario no encontrado.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta.' });

        res.json({ message: 'Login exitoso', user: { id: user.id, username: user.username, profilePic: user.profilePic } });
    });
});

// ==========================================
// RUTAS DE JUNTADAS Y ASISTENCIA
// ==========================================

// Obtener todas las juntadas
app.get('/api/meets', (req, res) => {
    db.all(`SELECT * FROM meets ORDER BY date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/**
 * MODIFICACIÓN AQUÍ: 
 * Ahora registra asistencia o ACTUALIZA si el usuario ya había votado en esa juntada.
 */
app.post('/api/attendance', (req, res) => {
    const { meet_id, user_id, status, reason } = req.body;
    
    // Verificamos si ya existe una respuesta de este usuario para esta juntada
    const checkQuery = `SELECT id FROM attendance WHERE meet_id = ? AND user_id = ?`;
    
    db.get(checkQuery, [meet_id, user_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Si ya existe, ACTUALIZAMOS el registro existente (sobrescribimos)
            const updateQuery = `UPDATE attendance SET status = ?, reason = ? WHERE id = ?`;
            db.run(updateQuery, [status, reason, row.id], function(errUpdate) {
                if (errUpdate) return res.status(500).json({ error: errUpdate.message });
                res.json({ message: 'Respuesta actualizada correctamente.' });
            });
        } else {
            // Si no existe, CREAMOS un nuevo registro
            const insertQuery = `INSERT INTO attendance (meet_id, user_id, status, reason) VALUES (?, ?, ?, ?)`;
            db.run(insertQuery, [meet_id, user_id, status, reason], function(errInsert) {
                if (errInsert) return res.status(500).json({ error: errInsert.message });
                res.json({ message: 'Asistencia registrada con éxito.' });
            });
        }
    });
});

// Obtener integrantes
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, profilePic FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Crear una nueva juntada
app.post('/api/meets', upload.single('image'), (req, res) => {
    const { place, date, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(`INSERT INTO meets (place, date, description, image) VALUES (?, ?, ?, ?)`, 
    [place, date, description, image], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Juntada creada con éxito.', id: this.lastID });
    });
});

// Obtener la lista de asistencias de una juntada específica
app.get('/api/meets/:id/attendance', (req, res) => {
    const meetId = req.params.id;
    const query = `
        SELECT u.id, u.username, u.profilePic, a.status, a.reason
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id AND a.meet_id = ?
    `;
    db.all(query, [meetId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Motor encendido. Servidor corriendo en http://localhost:${PORT}`);
});