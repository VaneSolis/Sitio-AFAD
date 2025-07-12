// Funcionalidades para la página de donaciones

$(document).ready(function() {
    let montoSeleccionado = 0;
    let metodoPagoSeleccionado = 'paypal';

    // Manejo de botones de monto
    $('.monto-btn').click(function() {
        $('.monto-btn').removeClass('active');
        $(this).addClass('active');
        montoSeleccionado = parseInt($(this).data('monto'));
        actualizarResumen();
    });

    // Manejo de monto personalizado
    $('#montoPersonalizado').on('input', function() {
        montoSeleccionado = parseInt($(this).val()) || 0;
        $('.monto-btn').removeClass('active');
        actualizarResumen();
    });

    // Manejo de método de pago
    $('input[name="metodoPago"]').change(function() {
        metodoPagoSeleccionado = $(this).val();
        actualizarResumen();
    });

    // Función para actualizar el resumen
    function actualizarResumen() {
        $('#montoResumen').text('$' + montoSeleccionado);
        
        let metodoTexto = '';
        switch(metodoPagoSeleccionado) {
            case 'paypal':
                metodoTexto = 'PayPal';
                break;
            case 'transferencia':
                metodoTexto = 'Transferencia bancaria';
                break;
            case 'efectivo':
                metodoTexto = 'Efectivo en refugio';
                break;
        }
        $('#metodoResumen').text(metodoTexto);
    }

    // Validación del formulario
    $('#formularioDonacion').on('submit', function(e) {
        e.preventDefault();
        
        const nombre = $('#nombre').val().trim();
        const email = $('#email').val().trim();
        const telefono = $('#telefono').val().trim();
        const mensaje = $('#mensaje').val().trim();
        
        // Validaciones
        if (!nombre) {
            mostrarError('Por favor ingresa tu nombre completo');
            return false;
        }
        
        if (!email) {
            mostrarError('Por favor ingresa tu correo electrónico');
            return false;
        }
        
        if (!isValidEmail(email)) {
            mostrarError('Por favor ingresa un email válido');
            return false;
        }
        
        if (montoSeleccionado <= 0) {
            mostrarError('Por favor selecciona un monto para donar');
            return false;
        }
        
        // Si todo está bien, procesar la donación
        procesarDonacion({
            nombre: nombre,
            email: email,
            telefono: telefono,
            mensaje: mensaje,
            monto: montoSeleccionado,
            metodoPago: metodoPagoSeleccionado
        });
    });

    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Función para mostrar errores
    function mostrarError(mensaje) {
        // Crear notificación de error
        const errorDiv = $('<div class="error-notification">' + mensaje + '</div>');
        $('body').append(errorDiv);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Función para procesar la donación
    async function procesarDonacion(datos) {
        // Mostrar loading
        const btnDonar = $('.btn-donar');
        const textoOriginal = btnDonar.html();
        btnDonar.html('<i class="fa-solid fa-spinner fa-spin"></i> Procesando...');
        btnDonar.prop('disabled', true);
        
        try {
            // Enviar donación al servidor
            const response = await fetch('/api/donaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });

            const result = await response.json();

            if (result.success) {
                // Mostrar mensaje de éxito
                mostrarExito('¡Gracias por tu donación! Te hemos enviado un correo de confirmación.');
                
                // Resetear formulario
                $('#formularioDonacion')[0].reset();
                montoSeleccionado = 0;
                $('.monto-btn').removeClass('active');
                actualizarResumen();
            } else {
                // Mostrar errores de validación
                if (result.errors) {
                    result.errors.forEach(error => {
                        mostrarError(error.msg);
                    });
                } else {
                    mostrarError(result.message || 'Error al procesar la donación');
                }
            }
        } catch (error) {
            console.error('Error al procesar donación:', error);
            mostrarError('Error de conexión. Por favor intenta de nuevo.');
        } finally {
            // Restaurar botón
            btnDonar.html(textoOriginal);
            btnDonar.prop('disabled', false);
        }
    }

    // Función para mostrar éxito
    function mostrarExito(mensaje) {
        const exitoDiv = $('<div class="exito-notification">' + mensaje + '</div>');
        $('body').append(exitoDiv);
        
        setTimeout(() => {
            exitoDiv.remove();
        }, 5000);
    }

    // Animaciones para las opciones de donación
    $('.opcion-donacion').hover(
        function() {
            $(this).find('.icono').css('transform', 'scale(1.1)');
        },
        function() {
            $(this).find('.icono').css('transform', 'scale(1)');
        }
    );

    // Efecto de contador para el impacto
    $('.impacto-item h3').each(function() {
        const $this = $(this);
        const countTo = $this.text().replace('$', '').replace(',', '');
        
        $({ countNum: 0 }).animate({
            countNum: countTo
        }, {
            duration: 2000,
            easing: 'linear',
            step: function() {
                $this.text('$' + Math.floor(this.countNum));
            },
            complete: function() {
                $this.text('$' + countTo);
            }
        });
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
});

// Estilos CSS para notificaciones
const estilosNotificaciones = `
<style>
.error-notification,
.exito-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideInRight 0.3s ease;
}

.error-notification {
    background: #dc3545;
}

.exito-notification {
    background: #28a745;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.btn-donar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
</style>
`;

// Agregar estilos al head
$('head').append(estilosNotificaciones); 