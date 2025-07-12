// Funcionalidades principales del sitio AFAD

// Menú móvil
$(document).ready(function() {
    // Toggle del menú móvil
    $("#iconomenu").click(function () {
        $("#contenedormenu").toggleClass("abrirmenu");
    });

    // Cerrar menú al hacer clic en un enlace
    $("#contenedormenu a").click(function() {
        $("#contenedormenu").removeClass("abrirmenu");
    });

    // Validación del formulario de contacto
    $('form').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#exampleInputEmail1').val();
        const mensaje = $('#exampleInputPassword1').val();
        
        if (!email || !mensaje) {
            alert('Por favor completa todos los campos');
            return false;
        }
        
        if (!isValidEmail(email)) {
            alert('Por favor ingresa un email válido');
            return false;
        }
        
        // Aquí se enviaría el formulario
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        this.reset();
    });

    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Smooth scroll para enlaces internos
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 100
            }, 800);
        }
    });

    // Animación de aparición de elementos
    $(window).scroll(function() {
        $('.contenedor-info, .info-canino').each(function() {
            const elementTop = $(this).offset().top;
            const elementBottom = elementTop + $(this).outerHeight();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            
            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                $(this).addClass('fade-in');
            }
        });
    });
}); 