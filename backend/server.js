const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require('./database'); // Tu conexión a Neon (PostgreSQL)

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DE MULTER (Memoria RAM)
// ==========================================
// Atajamos la foto en la memoria temporal antes de mandarla a ImgBB
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==========================================
// FUNCIÓN PARA SUBIR A IMGBB
// ==========================================
async function uploadToImgBB(buffer) {
    // Convertimos la imagen a texto (Base64) para que viaje segura por internet
    const base64Image = buffer.toString('base64');
    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    // Usamos el fetch nativo para mandarla a la API
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    if (!data.success) throw new Error('Error al subir imagen a ImgBB');
    
    return data.data.url; // Retorna el link de internet permanente
}

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.post('/api/register', upload.single('profilePic'), async (req, res) => {
    const { username, password } = req.body;
    
    if (!req.file) return res.status(400).json({ error: 'La foto de perfil es obligatoria.' });

    try {
        // 1. Subimos la foto a ImgBB y esperamos el link
        const profilePicUrl = await uploadToImgBB(req.file.buffer);
        
        // 2. Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 3. Guardamos todo en la base de datos PostgreSQL
        const query = `INSERT INTO users (username, password, profilePic) VALUES ($1, $2, $3) RETURNING id`;
        const result = await db.query(query, [username, hashedPassword, profilePicUrl]);
        
        res.status(201).json({ message: 'Usuario registrado con éxito.', id: result.rows[0].id });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'El usuario ya existe.' });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta.' });

        res.json({ message: 'Login exitoso', user: { id: user.id, username: user.username, profilePic: user.profilepic } });
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
        const query = `
            INSERT INTO attendance (meet_id, user_id, status, reason) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (meet_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason
        `;
        await db.query(query, [meet_id, user_id, status, reason]);
        res.json({ message: 'Asistencia registrada.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/users', async (req, res) => {
    try {
        // Le ponemos un alias (AS) con comillas dobles para forzar la mayúscula
        const result = await db.query(`SELECT id, username, profilepic AS "profilePic" FROM users`);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/meets', upload.single('image'), async (req, res) => {
    const { place, date, description } = req.body;
    
    try {
        // Subimos la foto a ImgBB si es que el creador subió una
        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadToImgBB(req.file.buffer);
        }

        const query = `INSERT INTO meets (place, date, description, image) VALUES ($1, $2, $3, $4) RETURNING id`;
        const result = await db.query(query, [place, date, description, imageUrl]);
        res.status(201).json({ message: 'Juntada creada con éxito.', id: result.rows[0].id });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/meets/:id/attendance', async (req, res) => {
    const meetId = req.params.id;
    try {
        const query = `
            SELECT u.id, u.username, u.profilepic AS "profilePic", a.status, a.reason
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