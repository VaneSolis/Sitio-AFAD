const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar rutas
const donacionesRoutes = require('./routes/donaciones');
const mascotasRoutes = require('./routes/mascotas');
const contactoRoutes = require('./routes/contacto');
const adminRoutes = require('./routes/admin');

// Importar base de datos
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});

// Middleware de seguridad
app.use(helmet());
app.use(limiter);
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../')));

// Rutas API
app.use('/api/donaciones', donacionesRoutes);
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AFAD API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Inicializar base de datos y arrancar servidor
async function startServer() {
    try {
        await initDatabase();
        console.log('✅ Base de datos inicializada correctamente');
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor AFAD corriendo en puerto ${PORT}`);
            console.log(`📊 Panel de administración: http://localhost:${PORT}/admin`);
            console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Error al inicializar el servidor:', error);
        process.exit(1);
    }
}

startServer(); 