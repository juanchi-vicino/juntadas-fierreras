const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database'); // Ahora importa PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Prevenir caída por carpeta vacía
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.post('/api/register', upload.single('profilePic'), async (req, res) => {
    const { username, password } = req.body;
    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    if (!profilePic) return res.status(400).json({ error: 'La foto de perfil es obligatoria.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // En PostgreSQL usamos RETURNING id para obtener el ID recién creado
        const query = `INSERT INTO users (username, password, profilePic) VALUES ($1, $2, $3) RETURNING id`;
        const result = await db.query(query, [username, hashedPassword, profilePic]);
        
        res.status(201).json({ message: 'Usuario registrado con éxito.', id: result.rows[0].id });
    } catch (error) {
        // Código 23505 es el error de "Usuario duplicado" en PostgreSQL
        if (error.code === '23505') return res.status(400).json({ error: 'El usuario ya existe.' });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
        const user = result.rows[0]; // PostgreSQL devuelve los datos dentro del array .rows

        if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta.' });

        res.json({ message: 'Login exitoso', user: { id: user.id, username: user.username, profilePic: user.profilePic } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTAS DE JUNTADAS Y ASISTENCIA
// ==========================================

app.get('/api/meets', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM meets ORDER BY date DESC`);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/attendance', async (req, res) => {
    const { meet_id, user_id, status, reason } = req.body;
    try {
        // PostgreSQL tiene el hermoso comando "ON CONFLICT" para actualizar si ya existe
        const query = `
            INSERT INTO attendance (meet_id, user_id, status, reason) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (meet_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason
        `;
        await db.query(query, [meet_id, user_id, status, reason]);
        res.json({ message: 'Asistencia registrada.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, username, profilePic FROM users`);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/meets', upload.single('image'), async (req, res) => {
    const { place, date, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const query = `INSERT INTO meets (place, date, description, image) VALUES ($1, $2, $3, $4) RETURNING id`;
        const result = await db.query(query, [place, date, description, image]);
        res.status(201).json({ message: 'Juntada creada con éxito.', id: result.rows[0].id });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/meets/:id/attendance', async (req, res) => {
    const meetId = req.params.id;
    try {
        const query = `
            SELECT u.id, u.username, u.profilePic, a.status, a.reason
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.meet_id = $1
        `;
        const result = await db.query(query, [meetId]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});