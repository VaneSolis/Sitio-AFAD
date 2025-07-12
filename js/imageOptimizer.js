// Optimización de imágenes y lazy loading para AFAD

document.addEventListener('DOMContentLoaded', function() {
    // Lazy loading para imágenes
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        imageObserver.observe(img);
    });

    // Precargar imágenes críticas
    const criticalImages = [
        'images/Logo Afad Circulo-PhotoRoom.png-PhotoRoom (1).png',
        'images/bienvenidos-afad.jpg'
    ];

    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });

    // Optimizar imágenes existentes
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
        // Agregar loading="lazy" si no lo tiene
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Agregar error handling
        img.addEventListener('error', function() {
            this.src = 'images/placeholder.jpg';
            this.alt = 'Imagen no disponible';
        });
    });
}); 