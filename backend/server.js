require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Base de Datos SQLite
const dbPath = path.join(__dirname, 'data', 'savewise.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// --- Rutas de Autenticación ---

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO usuarios (email, password) VALUES (?, ?)`;

        db.run(sql, [email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, message: 'El email ya está registrado.' });
                }
                return res.status(500).json({ success: false, message: 'Error al registrar el usuario.' });
            }
            res.status(201).json({ success: true, message: 'Usuario registrado con éxito.' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Login de usuario
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios.' });
    }

    const sql = `SELECT * FROM usuarios WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al buscar el usuario.' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Nota: En una app real usaríamos JWT aquí. Para este hackathon, simulamos login exitoso.
            res.json({
                success: true,
                message: 'Login exitoso',
                user: { id: user.id, email: user.email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend de SaveWise (Cumplimiento Hackathon) corriendo en puerto ${PORT}`);
});
