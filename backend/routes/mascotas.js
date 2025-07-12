const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getQuery, getOneQuery } = require('../database/init');
const { logMascota } = require('../services/logService');
const router = express.Router();

// Middleware para validar mascotas
const validarMascota = [
    body('nombre').trim().isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('tipo').isIn(['perro', 'gato']).withMessage('El tipo debe ser perro o gato'),
    body('edad').isIn(['cachorro', 'joven', 'adulto', 'senior']).withMessage('Edad inválida'),
    body('tamaño').isIn(['pequeño', 'mediano', 'grande']).withMessage('Tamaño inválido'),
    body('descripcion').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

// GET - Obtener todas las mascotas con filtros
router.get('/', async (req, res) => {
    try {
        const {
            tipo,
            edad,
            tamaño,
            estado = 'disponible',
            search,
            page = 1,
            limit = 20
        } = req.query;

        let whereConditions = ['estado = ?'];
        let params = [estado];

        if (tipo) {
            whereConditions.push('tipo = ?');
            params.push(tipo);
        }

        if (edad) {
            whereConditions.push('edad = ?');
            params.push(edad);
        }

        if (tamaño) {
            whereConditions.push('tamaño = ?');
            params.push(tamaño);
        }

        if (search) {
            whereConditions.push('(nombre LIKE ? OR descripcion LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');
        const offset = (page - 1) * limit;

        // Obtener mascotas con características
        const mascotas = await getQuery(`
            SELECT 
                m.*,
                GROUP_CONCAT(c.caracteristica) as caracteristicas
            FROM mascotas m
            LEFT JOIN caracteristicas_mascotas c ON m.id = c.mascota_id
            ${whereClause}
            GROUP BY m.id
            ORDER BY m.fecha_ingreso DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Obtener total de mascotas
        const totalResult = await getOneQuery(`
            SELECT COUNT(*) as total 
            FROM mascotas m
            ${whereClause}
        `, params);

        const total = totalResult.total;
        const totalPages = Math.ceil(total / limit);

        // Procesar características
        const mascotasProcesadas = mascotas.map(mascota => ({
            ...mascota,
            caracteristicas: mascota.caracteristicas ? mascota.caracteristicas.split(',') : []
        }));

        res.json({
            success: true,
            data: {
                mascotas: mascotasProcesadas,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener mascotas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener mascota específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const mascota = await getOneQuery(`
            SELECT 
                m.*,
                GROUP_CONCAT(c.caracteristica) as caracteristicas
            FROM mascotas m
            LEFT JOIN caracteristicas_mascotas c ON m.id = c.mascota_id
            WHERE m.id = ?
            GROUP BY m.id
        `, [id]);

        if (!mascota) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            });
        }

        // Procesar características
        mascota.caracteristicas = mascota.caracteristicas ? mascota.caracteristicas.split(',') : [];

        res.json({
            success: true,
            data: mascota
        });

    } catch (error) {
        console.error('Error al obtener mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// POST - Crear nueva mascota
router.post('/', validarMascota, async (req, res) => {
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
            tipo,
            edad,
            tamaño,
            descripcion,
            imagen,
            caracteristicas = []
        } = req.body;

        // Insertar mascota
        const result = await runQuery(`
            INSERT INTO mascotas (nombre, tipo, edad, tamaño, descripcion, imagen)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nombre, tipo, edad, tamaño, descripcion || null, imagen || null]);

        // Insertar características
        for (const caracteristica of caracteristicas) {
            await runQuery(`
                INSERT INTO caracteristicas_mascotas (mascota_id, caracteristica)
                VALUES (?, ?)
            `, [result.id, caracteristica]);
        }

        // Log de la actividad
        await logMascota('creada', result.id, { nombre, tipo, edad, tamaño });

        res.status(201).json({
            success: true,
            message: 'Mascota creada exitosamente',
            data: { id: result.id }
        });

    } catch (error) {
        console.error('Error al crear mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// PUT - Actualizar mascota
router.put('/:id', validarMascota, async (req, res) => {
    try {
        const { id } = req.params;
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
            tipo,
            edad,
            tamaño,
            descripcion,
            imagen,
            estado,
            caracteristicas = []
        } = req.body;

        // Verificar que la mascota existe
        const mascotaExistente = await getOneQuery('SELECT id FROM mascotas WHERE id = ?', [id]);
        if (!mascotaExistente) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            });
        }

        // Actualizar mascota
        await runQuery(`
            UPDATE mascotas 
            SET nombre = ?, tipo = ?, edad = ?, tamaño = ?, descripcion = ?, 
                imagen = ?, estado = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [nombre, tipo, edad, tamaño, descripcion || null, imagen || null, estado || 'disponible', id]);

        // Actualizar características
        await runQuery('DELETE FROM caracteristicas_mascotas WHERE mascota_id = ?', [id]);
        
        for (const caracteristica of caracteristicas) {
            await runQuery(`
                INSERT INTO caracteristicas_mascotas (mascota_id, caracteristica)
                VALUES (?, ?)
            `, [id, caracteristica]);
        }

        // Log de la actividad
        await logMascota('actualizada', id, { nombre, tipo, edad, tamaño, estado });

        res.json({
            success: true,
            message: 'Mascota actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// DELETE - Eliminar mascota
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery('DELETE FROM mascotas WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            });
        }

        // Log de la actividad
        await logMascota('eliminada', id);

        res.json({
            success: true,
            message: 'Mascota eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET - Obtener estadísticas de mascotas
router.get('/stats/overview', async (req, res) => {
    try {
        // Total de mascotas
        const totalMascotas = await getOneQuery('SELECT COUNT(*) as total FROM mascotas');
        
        // Mascotas por tipo
        const porTipo = await getQuery(`
            SELECT tipo, COUNT(*) as cantidad
            FROM mascotas
            GROUP BY tipo
        `);
        
        // Mascotas por estado
        const porEstado = await getQuery(`
            SELECT estado, COUNT(*) as cantidad
            FROM mascotas
            GROUP BY estado
        `);
        
        // Mascotas por edad
        const porEdad = await getQuery(`
            SELECT edad, COUNT(*) as cantidad
            FROM mascotas
            GROUP BY edad
        `);

        // Mascotas adoptadas este mes
        const adoptadasEsteMes = await getOneQuery(`
            SELECT COUNT(*) as total
            FROM mascotas
            WHERE estado = 'adoptada'
            AND fecha_adopcion >= date('now', 'start of month')
        `);

        res.json({
            success: true,
            data: {
                totalMascotas: totalMascotas.total,
                porTipo,
                porEstado,
                porEdad,
                adoptadasEsteMes: adoptadasEsteMes.total
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

module.exports = router; 