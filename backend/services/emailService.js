const nodemailer = require('nodemailer');

// Configuración del transportador de email
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.SMTP_USER || 'tu-email@gmail.com',
        pass: process.env.SMTP_PASS || 'tu-password'
    }
});

// Función para enviar email de confirmación de donación
async function enviarEmailDonacion(donacion) {
    try {
        const referencia = `AFAD-${donacion.id.toString().padStart(6, '0')}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmación de Donación - AFAD</title>
                <style>
                    body {
                        font-family: 'Poppins', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: linear-gradient(135deg, #ff6b35, #f7931e);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }
                    .content {
                        background: #f8f9fa;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }
                    .donation-details {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #ff6b35;
                    }
                    .amount {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #ff6b35;
                    }
                    .reference {
                        background: #e9ecef;
                        padding: 10px;
                        border-radius: 5px;
                        font-family: monospace;
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                    }
                    .btn {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #ff6b35;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 10px 5px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🐾 ¡Gracias por tu Donación!</h1>
                    <p>AFAD - Albergue Franciscano del Animal Desprotegido</p>
                </div>
                
                <div class="content">
                    <h2>Hola ${donacion.nombre},</h2>
                    
                    <p>Recibimos tu donación y queremos agradecerte por tu generosidad. Tu apoyo nos ayuda a seguir rescatando y cuidando a más animales en situación de calle.</p>
                    
                    <div class="donation-details">
                        <h3>Detalles de tu donación:</h3>
                        <p><strong>Monto:</strong> <span class="amount">$${donacion.monto}</span></p>
                        <p><strong>Método de pago:</strong> ${getMetodoPagoText(donacion.metodo_pago)}</p>
                        <p><strong>Referencia:</strong> <span class="reference">${referencia}</span></p>
                        <p><strong>Fecha:</strong> ${new Date(donacion.fecha_donacion).toLocaleDateString('es-MX')}</p>
                    </div>
                    
                    <h3>¿Qué hace tu donación?</h3>
                    <ul>
                        <li>💊 Proporciona medicamentos y vacunas</li>
                        <li>🍽️ Compra alimento de calidad</li>
                        <li>🏠 Mejora las instalaciones del refugio</li>
                        <li>🚑 Cubre gastos veterinarios</li>
                        <li>📚 Apoya programas educativos</li>
                    </ul>
                    
                    <p>Te mantendremos informado sobre cómo tu donación está ayudando a nuestros amigos peludos.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Visitar nuestro sitio</a>
                        <a href="https://wa.me/529995091837" class="btn">Contactar por WhatsApp</a>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>AFAD - Albergue Franciscano del Animal Desprotegido</strong></p>
                    <p>📧 contacto@afad.org | 📱 +52 9995091837</p>
                    <p>📍 Mérida, Yucatán, México</p>
                    <p>🌐 <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">www.afad.org</a></p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"AFAD" <${process.env.SMTP_USER || 'noreply@afad.org'}>`,
            to: donacion.email,
            subject: `Confirmación de Donación - ${referencia}`,
            html: htmlContent,
            text: `
                ¡Gracias por tu donación!
                
                Detalles de tu donación:
                - Monto: $${donacion.monto}
                - Método de pago: ${getMetodoPagoText(donacion.metodo_pago)}
                - Referencia: ${referencia}
                - Fecha: ${new Date(donacion.fecha_donacion).toLocaleDateString('es-MX')}
                
                Tu donación nos ayuda a:
                - Proporcionar medicamentos y vacunas
                - Comprar alimento de calidad
                - Mejorar las instalaciones del refugio
                - Cubrir gastos veterinarios
                - Apoyar programas educativos
                
                AFAD - Albergue Franciscano del Animal Desprotegido
                contacto@afad.org | +52 9995091837
                Mérida, Yucatán, México
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de donación enviado:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error al enviar email de donación:', error);
        throw error;
    }
}

// Función para enviar email de notificación a administradores
async function enviarNotificacionAdmin(donacion) {
    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Nueva Donación - AFAD</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .header { background: #ff6b35; color: white; padding: 20px; }
                    .content { padding: 20px; }
                    .details { background: #f8f9fa; padding: 15px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>💰 Nueva Donación Recibida</h1>
                </div>
                <div class="content">
                    <h2>Se ha recibido una nueva donación:</h2>
                    <div class="details">
                        <p><strong>Donante:</strong> ${donacion.nombre}</p>
                        <p><strong>Email:</strong> ${donacion.email}</p>
                        <p><strong>Teléfono:</strong> ${donacion.telefono || 'No proporcionado'}</p>
                        <p><strong>Monto:</strong> $${donacion.monto}</p>
                        <p><strong>Método de pago:</strong> ${getMetodoPagoText(donacion.metodo_pago)}</p>
                        <p><strong>Mensaje:</strong> ${donacion.mensaje || 'Sin mensaje'}</p>
                        <p><strong>Fecha:</strong> ${new Date(donacion.fecha_donacion).toLocaleString('es-MX')}</p>
                    </div>
                    <p>ID de donación: ${donacion.id}</p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"AFAD Sistema" <${process.env.SMTP_USER || 'noreply@afad.org'}>`,
            to: process.env.ADMIN_EMAIL || 'admin@afad.org',
            subject: `Nueva Donación - $${donacion.monto} - ${donacion.nombre}`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Notificación de admin enviada:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error al enviar notificación de admin:', error);
        throw error;
    }
}

// Función para enviar email de contacto
async function enviarEmailContacto(contacto) {
    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mensaje de Contacto - AFAD</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .header { background: #ff6b35; color: white; padding: 20px; }
                    .content { padding: 20px; }
                    .message { background: #f8f9fa; padding: 15px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📧 Nuevo Mensaje de Contacto</h1>
                </div>
                <div class="content">
                    <h2>Se ha recibido un nuevo mensaje:</h2>
                    <div class="message">
                        <p><strong>De:</strong> ${contacto.nombre}</p>
                        <p><strong>Email:</strong> ${contacto.email}</p>
                        <p><strong>Teléfono:</strong> ${contacto.telefono || 'No proporcionado'}</p>
                        <p><strong>Mensaje:</strong></p>
                        <p>${contacto.mensaje}</p>
                    </div>
                    <p>Fecha: ${new Date(contacto.fecha_contacto).toLocaleString('es-MX')}</p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"AFAD Contacto" <${process.env.SMTP_USER || 'noreply@afad.org'}>`,
            to: process.env.ADMIN_EMAIL || 'admin@afad.org',
            subject: `Nuevo Mensaje de Contacto - ${contacto.nombre}`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de contacto enviado:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error al enviar email de contacto:', error);
        throw error;
    }
}

// Función auxiliar para obtener texto del método de pago
function getMetodoPagoText(metodo) {
    const metodos = {
        'paypal': 'PayPal',
        'transferencia': 'Transferencia bancaria',
        'efectivo': 'Efectivo en refugio'
    };
    return metodos[metodo] || metodo;
}

// Función para verificar la configuración del email
async function verificarConfiguracionEmail() {
    try {
        await transporter.verify();
        console.log('✅ Configuración de email verificada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error en la configuración de email:', error);
        return false;
    }
}

module.exports = {
    enviarEmailDonacion,
    enviarNotificacionAdmin,
    enviarEmailContacto,
    verificarConfiguracionEmail
}; 