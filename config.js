// Configuración centralizada para AFAD

const AFAD_CONFIG = {
    // Información del refugio
    refugio: {
        nombre: "AFAD - Albergue Franciscano del Animal Desprotegido",
        direccion: "Mérida, Yucatán, México",
        telefono: "+52 9995091837",
        email: "contacto@afad.org",
        horarios: {
            semana: "8:00 am - 7:00 pm",
            sabado: "8:00 am - 2:00 pm",
            domingo: "Cerrado"
        }
    },

    // Redes sociales
    redesSociales: {
        facebook: "https://facebook.com/AFAD",
        instagram: "https://instagram.com/AFAD",
        whatsapp: "https://wa.me/529995091837",
        youtube: "https://youtube.com/@AFAD"
    },

    // Configuración de donaciones
    donaciones: {
        montos: [50, 100, 150, 200, 300, 500],
        metodosPago: [
            { id: 'paypal', nombre: 'PayPal', icono: 'fa-brands fa-paypal' },
            { id: 'transferencia', nombre: 'Transferencia bancaria', icono: 'fa-solid fa-university' },
            { id: 'efectivo', nombre: 'Efectivo en refugio', icono: 'fa-solid fa-money-bill' }
        ],
        cuentaBancaria: {
            banco: "Banco de México",
            cuenta: "1234567890",
            clabe: "012345678901234567",
            titular: "AFAD A.C."
        }
    },

    // Configuración de adopciones
    adopciones: {
        requisitos: [
            "Ser mayor de 18 años",
            "Tener ingresos estables",
            "Compromiso de esterilización",
            "Visita domiciliaria",
            "Firma de contrato de adopción"
        ],
        proceso: [
            "Conocer a la mascota",
            "Llenar formulario",
            "Entrevista",
            "Visita domiciliaria",
            "Firma de contrato",
            "Entrega de mascota"
        ]
    },

    // Configuración de imágenes
    imagenes: {
        placeholder: "images/placeholder.jpg",
        logo: "images/Logo Afad Circulo-PhotoRoom.png-PhotoRoom (1).png",
        hero: "images/bienvenidos-afad.jpg"
    },

    // Configuración de animaciones
    animaciones: {
        duracion: 300,
        easing: 'ease',
        delay: 100
    },

    // Configuración de formularios
    formularios: {
        validacion: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            telefono: /^[\+]?[1-9][\d]{0,15}$/,
            nombre: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/
        },
        mensajes: {
            error: {
                email: "Por favor ingresa un email válido",
                telefono: "Por favor ingresa un teléfono válido",
                nombre: "Por favor ingresa tu nombre completo",
                requerido: "Este campo es obligatorio"
            },
            exito: {
                contacto: "¡Gracias por tu mensaje! Te contactaremos pronto.",
                donacion: "¡Gracias por tu donación! Te hemos enviado un correo de confirmación.",
                adopcion: "¡Gracias por tu interés! Te contactaremos para coordinar la adopción."
            }
        }
    },

    // Configuración de SEO
    seo: {
        titulo: "AFAD - Albergue Franciscano del Animal Desprotegido",
        descripcion: "Refugio de animales en Mérida, Yucatán. Rescatamos, cuidamos y promovemos la adopción responsable de perros y gatos.",
        keywords: "refugio, animales, adopción, perros, gatos, Mérida, Yucatán, AFAD",
        autor: "AFAD",
        ogImage: "images/Logo Afad Circulo-PhotoRoom.png-PhotoRoom (1).png"
    },

    // Configuración de API (para futuras integraciones)
    api: {
        baseUrl: "https://api.afad.org",
        endpoints: {
            mascotas: "/mascotas",
            donaciones: "/donaciones",
            contacto: "/contacto",
            adopciones: "/adopciones"
        }
    },

    // Configuración de analytics
    analytics: {
        googleAnalytics: "G-XXXXXXXXXX",
        facebookPixel: "XXXXXXXXXX"
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AFAD_CONFIG;
} else {
    window.AFAD_CONFIG = AFAD_CONFIG;
} 