const express = require('express');
const { getQuery, getOneQuery } = require('../database/init');
const { getLogs, getLogStats } = require('../services/logService');
const router = express.Router();

// GET - Dashboard principal
router.get('/dashboard', async (req, res) => {
    try {
        // Estadísticas generales
        const stats = await getQuery(`
            SELECT 
                (SELECT COUNT(*) FROM mascotas WHERE estado = 'disponible') as mascotas_disponibles,
                (SELECT COUNT(*) FROM mascotas WHERE estado = 'adoptada') as mascotas_adoptadas,
                (SELECT COUNT(*) FROM donaciones WHERE estado = 'completado') as donaciones_completadas,
                (SELECT SUM(monto) FROM donaciones WHERE estado = 'completado') as total_recaudado,
                (SELECT COUNT(*) FROM contactos WHERE respondido = 0) as contactos_pendientes,
                (SELECT COUNT(*) FROM solicitudes_adopcion WHERE estado = 'pendiente') as solicitudes_pendientes
        `);

        // Donaciones recientes
        const donacionesRecientes = await getQuery(`
            SELECT * FROM donaciones 
            ORDER BY fecha_donacion DESC 
            LIMIT 5
        `);

        // Mascotas recientes
        const mascotasRecientes = await getQuery(`
            SELECT * FROM mascotas 
            ORDER BY fecha_ingreso DESC 
            LIMIT 5
        `);

        // Contactos recientes
        const contactosRecientes = await getQuery(`
            SELECT * FROM contactos 
            ORDER BY fecha_contacto DESC 
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                stats: stats[0],
                donacionesRecientes,
                mascotasRecientes,
                contactosRecientes
            }
        });

    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Estadísticas de donaciones
router.get('/stats/donaciones', async (req, res) => {
    try {
        const stats = await getQuery(`
            SELECT 
                COUNT(*) as total_donaciones,
                SUM(monto) as total_recaudado,
                AVG(monto) as promedio_donacion,
                COUNT(CASE WHEN estado = 'completado' THEN 1 END) as donaciones_completadas,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as donaciones_pendientes
            FROM donaciones
        `);

        const porMetodo = await getQuery(`
            SELECT 
                metodo_pago,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM donaciones 
            WHERE estado = 'completado'
            GROUP BY metodo_pago
        `);

        const porMes = await getQuery(`
            SELECT 
                strftime('%Y-%m', fecha_donacion) as mes,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM donaciones 
            WHERE fecha_donacion >= date('now', '-12 months')
            AND estado = 'completado'
            GROUP BY mes
            ORDER BY mes DESC
        `);

        res.json({
            success: true,
            data: {
                general: stats[0],
                porMetodo,
                porMes
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de donaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Estadísticas de mascotas
router.get('/stats/mascotas', async (req, res) => {
    try {
        const stats = await getQuery(`
            SELECT 
                COUNT(*) as total_mascotas,
                COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
                COUNT(CASE WHEN estado = 'adoptada' THEN 1 END) as adoptadas,
                COUNT(CASE WHEN tipo = 'perro' THEN 1 END) as perros,
                COUNT(CASE WHEN tipo = 'gato' THEN 1 END) as gatos
            FROM mascotas
        `);

        const porEdad = await getQuery(`
            SELECT 
                edad,
                COUNT(*) as cantidad
            FROM mascotas
            GROUP BY edad
        `);

        const porTamaño = await getQuery(`
            SELECT 
                tamaño,
                COUNT(*) as cantidad
            FROM mascotas
            GROUP BY tamaño
        `);

        const adoptadasPorMes = await getQuery(`
            SELECT 
                strftime('%Y-%m', fecha_adopcion) as mes,
                COUNT(*) as cantidad
            FROM mascotas 
            WHERE fecha_adopcion >= date('now', '-12 months')
            AND estado = 'adoptada'
            GROUP BY mes
            ORDER BY mes DESC
        `);

        res.json({
            success: true,
            data: {
                general: stats[0],
                porEdad,
                porTamaño,
                adoptadasPorMes
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de mascotas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Logs del sistema
router.get('/logs', async (req, res) => {
    try {
        const { nivel, fechaDesde, fechaHasta, limit = 100, offset = 0 } = req.query;
        
        const logs = await getLogs({
            nivel,
            fechaDesde,
            fechaHasta,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Error al obtener logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Estadísticas de logs
router.get('/logs/stats', async (req, res) => {
    try {
        const stats = await getLogStats();
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 