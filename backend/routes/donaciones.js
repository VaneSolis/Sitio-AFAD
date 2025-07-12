const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getQuery, getOneQuery } = require('../database/init');
const { enviarEmailDonacion } = require('../services/emailService');
const { logActivity } = require('../services/logService');
const router = express.Router();

// Middleware para validar donaciones
const validarDonacion = [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('monto').isFloat({ min: 10 }).withMessage('El monto mínimo es $10'),
    body('metodo_pago').isIn(['paypal', 'transferencia', 'efectivo']).withMessage('Método de pago inválido'),
    body('telefono').optional().isMobilePhone('es-MX').withMessage('Teléfono inválido'),
    body('mensaje').optional().isLength({ max: 500 }).withMessage('El mensaje no puede exceder 500 caracteres')
];

// POST - Crear nueva donación
router.post('/', validarDonacion, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const {
            nombre,
            email,
            telefono,
            monto,
            metodo_pago,
            mensaje
        } = req.body;

        // Insertar donación en la base de datos
        const result = await runQuery(`
            INSERT INTO donaciones (nombre, email, telefono, monto, metodo_pago, mensaje)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nombre, email, telefono, monto, metodo_pago, mensaje || null]);

        // Obtener la donación creada
        const donacion = await getOneQuery(`
            SELECT * FROM donaciones WHERE id = ?
        `, [result.id]);

        // Enviar email de confirmación
        try {
            await enviarEmailDonacion(donacion);
        } catch (emailError) {
            console.error('Error al enviar email:', emailError);
            // No fallar la donación si el email falla
        }

        // Log de la actividad
        await logActivity('info', `Nueva donación recibida: $${monto} por ${nombre}`, req.ip, req.get('User-Agent'));

        res.status(201).json({
            success: true,
            message: 'Donación registrada exitosamente',
            data: {
                id: donacion.id,
                referencia: `AFAD-${donacion.id.toString().padStart(6, '0')}`
            }
        });

    } catch (error) {
        console.error('Error al procesar donación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener todas las donaciones (con paginación)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const estado = req.query.estado;

        let whereClause = '';
        let params = [];

        if (estado) {
            whereClause = 'WHERE estado = ?';
            params.push(estado);
        }

        // Obtener donaciones
        const donaciones = await getQuery(`
            SELECT * FROM donaciones 
            ${whereClause}
            ORDER BY fecha_donacion DESC 
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Obtener total de donaciones
        const totalResult = await getOneQuery(`
            SELECT COUNT(*) as total FROM donaciones ${whereClause}
        `, params);

        const total = totalResult.total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                donaciones,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener donaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener estadísticas de donaciones
router.get('/stats', async (req, res) => {
    try {
        // Total de donaciones
        const totalDonaciones = await getOneQuery('SELECT COUNT(*) as total FROM donaciones');
        
        // Total recaudado
        const totalRecaudado = await getOneQuery('SELECT SUM(monto) as total FROM donaciones WHERE estado = "completado"');
        
        // Donaciones por método de pago
        const porMetodo = await getQuery(`
            SELECT metodo_pago, COUNT(*) as cantidad, SUM(monto) as total
            FROM donaciones 
            WHERE estado = "completado"
            GROUP BY metodo_pago
        `);
        
        // Donaciones por mes (últimos 12 meses)
        const porMes = await getQuery(`
            SELECT 
                strftime('%Y-%m', fecha_donacion) as mes,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM donaciones 
            WHERE fecha_donacion >= date('now', '-12 months')
            AND estado = "completado"
            GROUP BY mes
            ORDER BY mes DESC
        `);

        res.json({
            success: true,
            data: {
                totalDonaciones: totalDonaciones.total,
                totalRecaudado: totalRecaudado.total || 0,
                porMetodo,
                porMes
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener donación específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const donacion = await getOneQuery(`
            SELECT * FROM donaciones WHERE id = ?
        `, [id]);

        if (!donacion) {
            return res.status(404).json({
                success: false,
                message: 'Donación no encontrada'
            });
        }

        res.json({
            success: true,
            data: donacion
        });

    } catch (error) {
        console.error('Error al obtener donación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// PUT - Actualizar estado de donación
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, referencia_pago } = req.body;

        if (!['pendiente', 'completado', 'cancelado', 'rechazado'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const result = await runQuery(`
            UPDATE donaciones 
            SET estado = ?, referencia_pago = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [estado, referencia_pago || null, id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Donación no encontrada'
            });
        }

        // Log de la actividad
        await logActivity('info', `Donación ${id} actualizada a estado: ${estado}`, req.ip, req.get('User-Agent'));

        res.json({
            success: true,
            message: 'Estado de donación actualizado'
        });

    } catch (error) {
        console.error('Error al actualizar donación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// DELETE - Eliminar donación (solo para administradores)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await runQuery('DELETE FROM donaciones WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Donación no encontrada'
            });
        }

        // Log de la actividad
        await logActivity('warning', `Donación ${id} eliminada`, req.ip, req.get('User-Agent'));

        res.json({
            success: true,
            message: 'Donación eliminada'
        });

    } catch (error) {
        console.error('Error al eliminar donación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 