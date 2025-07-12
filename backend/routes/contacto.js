const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getQuery, getOneQuery } = require('../database/init');
const { enviarEmailContacto } = require('../services/emailService');
const { logActivity } = require('../services/logService');
const router = express.Router();

// Middleware para validar contactos
const validarContacto = [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('mensaje').trim().isLength({ min: 10, max: 1000 }).withMessage('El mensaje debe tener entre 10 y 1000 caracteres'),
    body('telefono').optional().isMobilePhone('es-MX').withMessage('Teléfono inválido')
];

// POST - Crear nuevo contacto
router.post('/', validarContacto, async (req, res) => {
    try {
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
            mensaje
        } = req.body;

        // Insertar contacto en la base de datos
        const result = await runQuery(`
            INSERT INTO contactos (nombre, email, telefono, mensaje)
            VALUES (?, ?, ?, ?)
        `, [nombre, email, telefono || null, mensaje]);

        // Obtener el contacto creado
        const contacto = await getOneQuery(`
            SELECT * FROM contactos WHERE id = ?
        `, [result.id]);

        // Enviar email de notificación
        try {
            await enviarEmailContacto(contacto);
        } catch (emailError) {
            console.error('Error al enviar email:', emailError);
        }

        // Log de la actividad
        await logActivity('info', `Nuevo contacto recibido de ${nombre}`, req.ip, req.get('User-Agent'));

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado exitosamente. Te contactaremos pronto.'
        });

    } catch (error) {
        console.error('Error al procesar contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener todos los contactos (con paginación)
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

        // Obtener contactos
        const contactos = await getQuery(`
            SELECT * FROM contactos 
            ${whereClause}
            ORDER BY fecha_contacto DESC 
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Obtener total de contactos
        const totalResult = await getOneQuery(`
            SELECT COUNT(*) as total FROM contactos ${whereClause}
        `, params);

        const total = totalResult.total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                contactos,
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
        console.error('Error al obtener contactos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener contacto específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const contacto = await getOneQuery(`
            SELECT * FROM contactos WHERE id = ?
        `, [id]);

        if (!contacto) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }

        res.json({
            success: true,
            data: contacto
        });

    } catch (error) {
        console.error('Error al obtener contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// PUT - Marcar contacto como respondido
router.put('/:id/responder', async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;

        const result = await runQuery(`
            UPDATE contactos 
            SET respondido = 1, fecha_respuesta = CURRENT_TIMESTAMP, 
                observaciones = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [observaciones || null, id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }

        // Log de la actividad
        await logActivity('info', `Contacto ${id} marcado como respondido`, req.ip, req.get('User-Agent'));

        res.json({
            success: true,
            message: 'Contacto marcado como respondido'
        });

    } catch (error) {
        console.error('Error al actualizar contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// DELETE - Eliminar contacto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await runQuery('DELETE FROM contactos WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }

        // Log de la actividad
        await logActivity('warning', `Contacto ${id} eliminado`, req.ip, req.get('User-Agent'));

        res.json({
            success: true,
            message: 'Contacto eliminado'
        });

    } catch (error) {
        console.error('Error al eliminar contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 