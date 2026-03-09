require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5500' }));
app.use(express.json());

// Temporal en memoria estructurado como: { 'user@email.com': { code: '123456', expiresAt: 123456789 } }
const verificationCodes = {};

// Configurar el transporte de nodemailer
// Sustituir el auth.user y auth.pass por los propios del usuario en .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'guilermovillcabarriga@gmail.com', // El usuario puede reemplazar esto
        pass: process.env.EMAIL_PASS || 'gmjneyisrynnvzsj' // Y su contraseña de aplicación aquí
    }
});

/**
 * Recibe el email del login de Google, genera un código de 6 dígitos
 * y lo envía por correo electrónico al usuario.
 */
app.post('/auth/google', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email es requerido' });
    }

    // Generar código aleatorio de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar el código en memoria, válido por 10 minutos
    verificationCodes[email] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000
    };

    console.log(`Código generado para ${email}: ${code}`);

    try {
        // Enviar el correo
        const mailOptions = {
            from: `"SaveWise Authentication" <${transporter.options.auth.user}>`,
            to: email,
            subject: 'Tu código de verificación para SaveWise',
            text: `Hola!\n\nTu código de verificación para iniciar sesión en SaveWise es: ${code}\n\nEste código es válido por 10 minutos.\n\nSi no solicitaste este código, puedes ignorar este correo.`,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2>Autenticación SaveWise</h2>
                    <p>Tu código de seguridad temporal es:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background-color: #f3f4f6; display: inline-block; border-radius: 8px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>Es válido por 10 minutos.</p>
                </div>
            `
        };

        // NOTA: Si están usando credenciales falsas en el desarrollo y no hay un correo válido configurado, fallará.
        // Hacemos el try/catch y devolvemos siempre true al frontend para continuar la demo aunque falle el envío (útil para pruebas locales).
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Código enviado correctamente' });
    } catch (error) {
        console.error("Error enviando email (¿Configuras la contraseña de aplicación?):", error);
        // Devolvemos el código en el mensaje de error *solo* temporalmente para que el usuario pueda avanzar
        // si todavía no tiene configurado el nodemailer
        res.status(500).json({
            success: false,
            message: 'Error al enviar el email, pero para que puedas probar la app, el código es: ' + code + '. Revisa tu consola del servidor backend.'
        });
    }
});

/**
 * Verifica si el código introducido por el usuario coincide con el generado.
 */
app.post('/auth/verify', (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros' });
    }

    const record = verificationCodes[email];

    if (!record) {
        return res.status(400).json({ success: false, message: 'No hay código pendiente para este email.' });
    }

    if (Date.now() > record.expiresAt) {
        delete verificationCodes[email];
        return res.status(400).json({ success: false, message: 'El código ha expirado.' });
    }

    if (record.code === code) {
        // Validación correcta
        delete verificationCodes[email]; // Se limpia por seguridad
        return res.json({ success: true, message: 'Verificación exitosa' });
    } else {
        // Validación incorrecta
        return res.status(400).json({ success: false, message: 'Código incorrecto. Inténtalo de nuevo.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend de SaveWise escuchando en http://localhost:${PORT}`);
    console.log(`CORS habilitado para http://localhost:5500`);
});
