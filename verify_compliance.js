const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const API_URL = 'http://localhost:3000/api/auth';
const DB_PATH = path.join(__dirname, 'backend', 'data', 'savewise.db');

async function testCompliance() {
    console.log("--- Iniciando Pruebas de Cumplimiento Hackathon ---");

    // 1. Verificar existencia de la DB y hashing
    console.log("\n1. Verificando persistencia y hashing...");
    const db = new sqlite3.Database(DB_PATH);

    // Simular un registro manual para probar hashing y persistencia si es necesario, 
    // pero aquí mejor probamos la API directamente si el servidor está corriendo.
    // Usaremos axios para probar las rutas.

    try {
        const email = `test_${Date.now()}@example.com`;
        const password = "password123";

        // Prueba de Registro
        console.log(`Intentando registrar: ${email}`);
        const regRes = await axios.post(`${API_URL}/register`, {
            email,
            password,
            confirmPassword: password
        });
        console.log("Registro API:", regRes.data.success ? "EXITO" : "FALLO");

        // Prueba de Login
        console.log(`Intentando login: ${email}`);
        const loginRes = await axios.post(`${API_URL}/login`, {
            email,
            password
        });
        console.log("Login API:", loginRes.data.success ? "EXITO" : "FALLO");

        // Verificar Hashing en DB
        db.get("SELECT password FROM usuarios WHERE email = ?", [email], (err, row) => {
            if (row) {
                const isHashed = row.password.startsWith('$2b$');
                console.log("¿Contraseña hasheada con bcrypt?:", isHashed ? "SÍ" : "NO");
            }
            db.close();
        });

    } catch (error) {
        console.error("Error en las pruebas de API (¿El servidor está corriendo?):", error.message);
    }
}

// Nota: Para correr esto, el servidor debe estar encendido: node backend/server.js
testCompliance();
