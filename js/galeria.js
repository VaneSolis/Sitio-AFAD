// Funcionalidades para la galería de mascotas

$(document).ready(function() {
    // Datos de ejemplo de mascotas
    const mascotas = [
        {
            id: 1,
            nombre: "Luna",
            tipo: "gato",
            edad: "joven",
            tamaño: "mediano",
            imagen: "../images/gato-con-flores.jpg",
            descripcion: "Luna es una gata muy cariñosa y juguetona. Le encanta estar cerca de las personas y es perfecta para familias con niños.",
            caracteristicas: ["Cariñosa", "Juguetona", "Buena con niños", "Vacunada", "Esterilizada"]
        },
        {
            id: 2,
            nombre: "Max",
            tipo: "perro",
            edad: "adulto",
            tamaño: "grande",
            imagen: "../images/perro-maleta-azul.jpg",
            descripcion: "Max es un perro muy leal y protector. Es ideal para familias activas que disfruten de largas caminatas.",
            caracteristicas: ["Leal", "Protector", "Activo", "Vacunado", "Entrenado"]
        },
        {
            id: 3,
            nombre: "Mittens",
            tipo: "gato",
            edad: "cachorro",
            tamaño: "pequeño",
            imagen: "../images/gato-con-moño.jpg",
            descripcion: "Mittens es un gatito adorable y curioso. Está en la edad perfecta para socializar y aprender.",
            caracteristicas: ["Curioso", "Juguetón", "Inteligente", "Vacunado", "Desparasitado"]
        },
        {
            id: 4,
            nombre: "Buddy",
            tipo: "perro",
            edad: "senior",
            tamaño: "mediano",
            imagen: "../images/perrito-amarillo.webp",
            descripcion: "Buddy es un perro tranquilo y sabio. Perfecto para personas que buscan un compañero calmado.",
            caracteristicas: ["Tranquilo", "Sabio", "Cariñoso", "Vacunado", "Esterilizado"]
        },
        {
            id: 5,
            nombre: "Whiskers",
            tipo: "gato",
            edad: "adulto",
            tamaño: "mediano",
            imagen: "../images/gato-adulto-en-adopcion.jpg",
            descripcion: "Whiskers es un gato independiente pero cariñoso. Ideal para personas que trabajan fuera de casa.",
            caracteristicas: ["Independiente", "Cariñoso", "Limpio", "Vacunado", "Esterilizado"]
        },
        {
            id: 6,
            nombre: "Rocky",
            tipo: "perro",
            edad: "joven",
            tamaño: "grande",
            imagen: "../images/perrito con bolsa.jpg",
            descripcion: "Rocky es un perro enérgico y amigable. Le encanta jugar y es muy sociable con otros perros.",
            caracteristicas: ["Enérgico", "Amigable", "Sociable", "Vacunado", "Entrenado"]
        }
    ];

    let mascotasFiltradas = [...mascotas];

    // Cargar mascotas desde el servidor
    cargarMascotasDesdeServidor();

    // Eventos de filtros
    $('#tipo-mascota, #edad-mascota, #tamaño-mascota').change(function() {
        filtrarMascotas();
    });

    $('#buscar-mascota').on('input', function() {
        filtrarMascotas();
    });

    // Función para cargar mascotas desde el servidor
    async function cargarMascotasDesdeServidor() {
        try {
            const params = new URLSearchParams();
            const tipo = $('#tipo-mascota').val();
            const edad = $('#edad-mascota').val();
            const tamaño = $('#tamaño-mascota').val();
            const busqueda = $('#buscar-mascota').val();

            if (tipo && tipo !== 'todos') params.append('tipo', tipo);
            if (edad && edad !== 'todas') params.append('edad', edad);
            if (tamaño && tamaño !== 'todos') params.append('tamaño', tamaño);
            if (busqueda) params.append('search', busqueda);

            const response = await fetch(`/api/mascotas?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                cargarMascotas(result.data.mascotas);
            } else {
                console.error('Error al cargar mascotas:', result.message);
                cargarMascotas([]);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            cargarMascotas([]);
        }
    }

    // Función para filtrar mascotas
    function filtrarMascotas() {
        cargarMascotasDesdeServidor();
    }

    // Función para cargar mascotas en la galería
    function cargarMascotas(mascotasArray) {
        const galeriaGrid = $('#galeria-grid');
        galeriaGrid.empty();

        if (mascotasArray.length === 0) {
            galeriaGrid.html(`
                <div class="no-resultados">
                    <i class="fa-solid fa-search"></i>
                    <h3>No se encontraron mascotas</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `);
            return;
        }

        mascotasArray.forEach(mascota => {
            const mascotaCard = `
                <div class="mascota-card" data-mascota-id="${mascota.id}">
                    <img src="${mascota.imagen}" alt="${mascota.nombre}" class="mascota-imagen">
                    <div class="mascota-info">
                        <h3 class="mascota-nombre">${mascota.nombre}</h3>
                        <p class="mascota-descripcion">${mascota.descripcion}</p>
                        <div class="mascota-caracteristicas">
                            ${mascota.caracteristicas.map(car => `<span class="caracteristica">${car}</span>`).join('')}
                        </div>
                        <button class="btn-adoptar" onclick="verDetalles(${mascota.id})">
                            <i class="fa-solid fa-heart"></i> Conocer más
                        </button>
                    </div>
                </div>
            `;
            galeriaGrid.append(mascotaCard);
        });

        // Animación de aparición
        $('.mascota-card').each(function(index) {
            $(this).css('animation-delay', `${index * 0.1}s`);
            $(this).addClass('fade-in');
        });
    }

    // Función para ver detalles de mascota (modal)
    window.verDetalles = function(mascotaId) {
        const mascota = mascotas.find(m => m.id === mascotaId);
        if (!mascota) return;

        const modalContent = `
            <div class="modal-mascota-content">
                <img src="${mascota.imagen}" alt="${mascota.nombre}" class="modal-imagen">
                <div class="modal-info">
                    <h2 class="modal-nombre">${mascota.nombre}</h2>
                    <p class="modal-descripcion">${mascota.descripcion}</p>
                    <div class="modal-caracteristicas">
                        ${mascota.caracteristicas.map(car => `<span class="modal-caracteristica">${car}</span>`).join('')}
                    </div>
                    <div class="modal-acciones">
                        <a href="./contacto.html" class="btn-modal btn-adoptar-modal">
                            <i class="fa-solid fa-heart"></i> Adoptar
                        </a>
                        <a href="https://wa.me/529995091837?text=Hola, estoy interesado en adoptar a ${mascota.nombre}" 
                           target="_blank" class="btn-modal btn-contactar-modal">
                            <i class="fa-brands fa-whatsapp"></i> Contactar
                        </a>
                    </div>
                </div>
            </div>
        `;

        $('#modal-content').html(modalContent);
        $('#modal-mascota').show();
    };

    // Cerrar modal
    $('.close').click(function() {
        $('#modal-mascota').hide();
    });

    // Cerrar modal al hacer clic fuera
    $(window).click(function(event) {
        if (event.target === document.getElementById('modal-mascota')) {
            $('#modal-mascota').hide();
        }
    });

    // Cerrar modal con ESC
    $(document).keydown(function(event) {
        if (event.keyCode === 27) { // ESC key
            $('#modal-mascota').hide();
        }
    });

    // Animación de contador para los pasos
    $('.numero-paso').each(function(index) {
        $(this).css('animation-delay', `${index * 0.2}s`);
        $(this).addClass('fade-in');
    });

    // Scroll suave para enlaces internos
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 100
            }, 800);
        }
    });

    // Lazy loading para imágenes
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px 50px 0px'
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, observerOptions);

    // Observar imágenes para lazy loading
    $('img[data-src]').each(function() {
        imageObserver.observe(this);
    });
});

// Estilos CSS adicionales para la galería
const estilosGaleria = `
<style>
.no-resultados {
    text-align: center;
    padding: 60px 20px;
    grid-column: 1 / -1;
}

.no-resultados i {
    font-size: 4rem;
    color: #ddd;
    margin-bottom: 20px;
}

.no-resultados h3 {
    color: #666;
    margin-bottom: 10px;
}

.no-resultados p {
    color: #999;
}

.mascota-card {
    opacity: 0;
    transform: translateY(30px);
}

.mascota-card.fade-in {
    animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.numero-paso {
    opacity: 0;
    transform: scale(0.5);
}

.numero-paso.fade-in {
    animation: scaleIn 0.6s ease forwards;
}

@keyframes scaleIn {
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
`;

// Agregar estilos al head
$('head').append(estilosGaleria); 