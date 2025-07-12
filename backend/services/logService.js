const { runQuery } = require('../database/init');

// Función para registrar actividad en el sistema
async function logActivity(nivel, mensaje, ip = null, userAgent = null, usuarioId = null) {
    try {
        await runQuery(`
            INSERT INTO logs (nivel, mensaje, ip, user_agent, usuario_id)
            VALUES (?, ?, ?, ?, ?)
        `, [nivel, mensaje, ip, userAgent, usuarioId]);

        // También mostrar en consola en desarrollo
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${nivel.toUpperCase()}] ${mensaje}`;
            
            switch (nivel) {
                case 'error':
                    console.error(logMessage);
                    break;
                case 'warning':
                    console.warn(logMessage);
                    break;
                case 'info':
                    console.info(logMessage);
                    break;
                default:
                    console.log(logMessage);
            }
        }
    } catch (error) {
        console.error('Error al registrar log:', error);
    }
}

// Función para obtener logs con filtros
async function getLogs(filtros = {}) {
    try {
        const {
            nivel,
            fechaDesde,
            fechaHasta,
            limit = 100,
            offset = 0
        } = filtros;

        let whereConditions = [];
        let params = [];

        if (nivel) {
            whereConditions.push('nivel = ?');
            params.push(nivel);
        }

        if (fechaDesde) {
            whereConditions.push('created_at >= ?');
            params.push(fechaDesde);
        }

        if (fechaHasta) {
            whereConditions.push('created_at <= ?');
            params.push(fechaHasta);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        const logs = await runQuery(`
            SELECT 
                l.*,
                u.nombre as usuario_nombre
            FROM logs l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        return logs;
    } catch (error) {
        console.error('Error al obtener logs:', error);
        throw error;
    }
}

// Función para limpiar logs antiguos
async function limpiarLogsAntiguos(dias = 30) {
    try {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        const result = await runQuery(`
            DELETE FROM logs 
            WHERE created_at < ?
        `, [fechaLimite.toISOString()]);

        console.log(`🧹 Limpiados ${result.changes} logs antiguos (más de ${dias} días)`);
        return result.changes;
    } catch (error) {
        console.error('Error al limpiar logs:', error);
        throw error;
    }
}

// Función para obtener estadísticas de logs
async function getLogStats() {
    try {
        const stats = await runQuery(`
            SELECT 
                nivel,
                COUNT(*) as cantidad,
                DATE(created_at) as fecha
            FROM logs 
            WHERE created_at >= date('now', '-7 days')
            GROUP BY nivel, DATE(created_at)
            ORDER BY fecha DESC, nivel
        `);

        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas de logs:', error);
        throw error;
    }
}

// Función para registrar login de usuario
async function logLogin(usuarioId, ip, userAgent, exitoso = true) {
    const mensaje = exitoso 
        ? `Login exitoso del usuario ID: ${usuarioId}`
        : `Intento de login fallido desde IP: ${ip}`;
    
    await logActivity(
        exitoso ? 'info' : 'warning',
        mensaje,
        ip,
        userAgent,
        exitoso ? usuarioId : null
    );
}

// Función para registrar acciones de donaciones
async function logDonacion(accion, donacionId, detalles = {}) {
    const mensaje = `Donación ${donacionId}: ${accion} - ${JSON.stringify(detalles)}`;
    await logActivity('info', mensaje);
}

// Función para registrar acciones de mascotas
async function logMascota(accion, mascotaId, detalles = {}) {
    const mensaje = `Mascota ${mascotaId}: ${accion} - ${JSON.stringify(detalles)}`;
    await logActivity('info', mensaje);
}

// Función para registrar errores del sistema
async function logError(error, contexto = '') {
    const mensaje = `Error: ${error.message} - Contexto: ${contexto}`;
    await logActivity('error', mensaje);
}

// Función para registrar actividad de administración
async function logAdmin(accion, detalles = {}, usuarioId = null) {
    const mensaje = `Admin: ${accion} - ${JSON.stringify(detalles)}`;
    await logActivity('info', mensaje, null, null, usuarioId);
}

module.exports = {
    logActivity,
    getLogs,
    limpiarLogsAntiguos,
    getLogStats,
    logLogin,
    logDonacion,
    logMascota,
    logError,
    logAdmin
}; 