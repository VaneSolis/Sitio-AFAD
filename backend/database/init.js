const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear conexión a la base de datos
const dbPath = path.join(__dirname, 'afad.db');
const db = new sqlite3.Database(dbPath);

// Función para ejecutar queries de forma asíncrona
function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

// Función para obtener datos
function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Función para obtener un solo registro
function getOneQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Inicializar base de datos
async function initDatabase() {
    try {
        // Habilitar foreign keys
        await runQuery('PRAGMA foreign_keys = ON');

        // Tabla de usuarios (administradores)
        await runQuery(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre TEXT NOT NULL,
                rol TEXT DEFAULT 'admin',
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de donaciones
        await runQuery(`
            CREATE TABLE IF NOT EXISTS donaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT NOT NULL,
                telefono TEXT,
                monto DECIMAL(10,2) NOT NULL,
                metodo_pago TEXT NOT NULL,
                mensaje TEXT,
                estado TEXT DEFAULT 'pendiente',
                referencia_pago TEXT,
                fecha_donacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                procesado BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de mascotas
        await runQuery(`
            CREATE TABLE IF NOT EXISTS mascotas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                tipo TEXT NOT NULL,
                edad TEXT NOT NULL,
                tamaño TEXT NOT NULL,
                descripcion TEXT,
                imagen TEXT,
                estado TEXT DEFAULT 'disponible',
                fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_adopcion DATETIME,
                adoptante_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de características de mascotas
        await runQuery(`
            CREATE TABLE IF NOT EXISTS caracteristicas_mascotas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mascota_id INTEGER NOT NULL,
                caracteristica TEXT NOT NULL,
                FOREIGN KEY (mascota_id) REFERENCES mascotas (id) ON DELETE CASCADE
            )
        `);

        // Tabla de solicitudes de adopción
        await runQuery(`
            CREATE TABLE IF NOT EXISTS solicitudes_adopcion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mascota_id INTEGER NOT NULL,
                nombre_solicitante TEXT NOT NULL,
                email TEXT NOT NULL,
                telefono TEXT NOT NULL,
                direccion TEXT,
                experiencia_mascotas TEXT,
                motivo_adopcion TEXT,
                estado TEXT DEFAULT 'pendiente',
                fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_revision DATETIME,
                revisado_por INTEGER,
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mascota_id) REFERENCES mascotas (id) ON DELETE CASCADE,
                FOREIGN KEY (revisado_por) REFERENCES usuarios (id)
            )
        `);

        // Tabla de contactos
        await runQuery(`
            CREATE TABLE IF NOT EXISTS contactos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT NOT NULL,
                telefono TEXT,
                mensaje TEXT NOT NULL,
                estado TEXT DEFAULT 'nuevo',
                fecha_contacto DATETIME DEFAULT CURRENT_TIMESTAMP,
                respondido BOOLEAN DEFAULT 0,
                fecha_respuesta DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de eventos/actividades
        await runQuery(`
            CREATE TABLE IF NOT EXISTS eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                fecha_inicio DATETIME NOT NULL,
                fecha_fin DATETIME,
                ubicacion TEXT,
                imagen TEXT,
                estado TEXT DEFAULT 'activo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de recursos educativos
        await runQuery(`
            CREATE TABLE IF NOT EXISTS recursos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                tipo TEXT NOT NULL,
                url TEXT,
                archivo TEXT,
                imagen TEXT,
                estado TEXT DEFAULT 'activo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de logs del sistema
        await runQuery(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nivel TEXT NOT NULL,
                mensaje TEXT NOT NULL,
                usuario_id INTEGER,
                ip TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
            )
        `);

        // Insertar datos de ejemplo
        await insertSampleData();

        console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Insertar datos de ejemplo
async function insertSampleData() {
    try {
        // Insertar usuario administrador por defecto
        const adminExists = await getOneQuery('SELECT id FROM usuarios WHERE email = ?', ['admin@afad.org']);
        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await runQuery(`
                INSERT INTO usuarios (email, password, nombre, rol)
                VALUES (?, ?, ?, ?)
            `, ['admin@afad.org', hashedPassword, 'Administrador AFAD', 'admin']);
        }

        // Insertar mascotas de ejemplo
        const mascotasExists = await getOneQuery('SELECT id FROM mascotas LIMIT 1');
        if (!mascotasExists) {
            const mascotas = [
                {
                    nombre: 'Luna',
                    tipo: 'gato',
                    edad: 'joven',
                    tamaño: 'mediano',
                    descripcion: 'Luna es una gata muy cariñosa y juguetona. Le encanta estar cerca de las personas y es perfecta para familias con niños.',
                    imagen: 'images/gato-con-flores.jpg',
                    caracteristicas: ['Cariñosa', 'Juguetona', 'Buena con niños', 'Vacunada', 'Esterilizada']
                },
                {
                    nombre: 'Max',
                    tipo: 'perro',
                    edad: 'adulto',
                    tamaño: 'grande',
                    descripcion: 'Max es un perro muy leal y protector. Es ideal para familias activas que disfruten de largas caminatas.',
                    imagen: 'images/perro-maleta-azul.jpg',
                    caracteristicas: ['Leal', 'Protector', 'Activo', 'Vacunado', 'Entrenado']
                },
                {
                    nombre: 'Mittens',
                    tipo: 'gato',
                    edad: 'cachorro',
                    tamaño: 'pequeño',
                    descripcion: 'Mittens es un gatito adorable y curioso. Está en la edad perfecta para socializar y aprender.',
                    imagen: 'images/gato-con-moño.jpg',
                    caracteristicas: ['Curioso', 'Juguetón', 'Inteligente', 'Vacunado', 'Desparasitado']
                }
            ];

            for (const mascota of mascotas) {
                const result = await runQuery(`
                    INSERT INTO mascotas (nombre, tipo, edad, tamaño, descripcion, imagen)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [mascota.nombre, mascota.tipo, mascota.edad, mascota.tamaño, mascota.descripcion, mascota.imagen]);

                // Insertar características
                for (const caracteristica of mascota.caracteristicas) {
                    await runQuery(`
                        INSERT INTO caracteristicas_mascotas (mascota_id, caracteristica)
                        VALUES (?, ?)
                    `, [result.id, caracteristica]);
                }
            }
        }

        // Insertar eventos de ejemplo
        const eventosExists = await getOneQuery('SELECT id FROM eventos LIMIT 1');
        if (!eventosExists) {
            await runQuery(`
                INSERT INTO eventos (titulo, descripcion, fecha_inicio, ubicacion)
                VALUES (?, ?, ?, ?)
            `, [
                'Jornada de Adopción',
                'Ven a conocer a nuestros amigos peludos disponibles para adopción',
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                'Refugio AFAD'
            ]);
        }

        console.log('✅ Datos de ejemplo insertados correctamente');
    } catch (error) {
        console.error('❌ Error al insertar datos de ejemplo:', error);
    }
}

// Función para cerrar la conexión
function closeDatabase() {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    db,
    runQuery,
    getQuery,
    getOneQuery,
    initDatabase,
    closeDatabase
}; 