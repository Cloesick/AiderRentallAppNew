// Property image slider functionality
document.addEventListener('DOMContentLoaded', function() {
    initializePropertySliders();
});

function initializePropertySliders() {
    const sliders = document.querySelectorAll('.property-image-slider');
    
    sliders.forEach(slider => {
        const images = slider.querySelectorAll('.property-image');
        const prevBtn = slider.querySelector('.image-nav.prev');
        const nextBtn = slider.querySelector('.image-nav.next');
        const dots = slider.querySelectorAll('.image-dot');
        
        if (images.length <= 1) return;
        
        let currentIndex = 0;
        
        // Previous button click
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                updateSlider();
            });
        }
        
        // Next button click
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                currentIndex = (currentIndex + 1) % images.length;
                updateSlider();
            });
        }
        
        // Dot clicks
        dots.forEach(dot => {
            dot.addEventListener('click', function() {
                currentIndex = parseInt(this.getAttribute('data-index'));
                updateSlider();
            });
        });
        
        // Auto-advance every 5 seconds
        setInterval(function() {
            currentIndex = (currentIndex + 1) % images.length;
            updateSlider();
        }, 5000);
        
        function updateSlider() {
            // Update images
            images.forEach((img, index) => {
                img.classList.toggle('active', index === currentIndex);
            });
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }
    });
}
