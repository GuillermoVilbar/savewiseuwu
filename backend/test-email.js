
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'guilermovillcabarriga@gmail.com',
        pass: process.env.EMAIL_PASS || 'gmjneyisrynnvzsj'
    }
});

const mailOptions = {
    from: `"Test" <${transporter.options.auth.user}>`,
    to: 'guilermovillcabarriga@gmail.com',
    subject: 'SMTP Test',
    text: 'Test message'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error occurred:', error.message);
        process.exit(1);
    }
    console.log('Message sent successfully!');
    console.log('Server responded with:', info.response);
    process.exit(0);
});
