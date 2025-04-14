// European travel destinations slideshow
document.addEventListener('DOMContentLoaded', function() {
    initializeDestinationSlideshow();
});

function initializeDestinationSlideshow() {
    const slideshow = document.querySelector('.destination-slideshow');
    if (!slideshow) return;
    
    const slides = slideshow.querySelectorAll('.destination-slide');
    if (slides.length === 0) return;
    
    let currentIndex = 0;
    
    // Show the first slide initially
    slides[0].classList.add('active');
    
    // Change slide every 3 seconds
    setInterval(function() {
        // Hide current slide
        slides[currentIndex].classList.remove('active');
        
        // Move to next slide
        currentIndex = (currentIndex + 1) % slides.length;
        
        // Show new slide
        slides[currentIndex].classList.add('active');
    }, 3000);
    
    // Add click event to each slide
    slides.forEach(slide => {
        slide.addEventListener('click', function() {
            const location = this.getAttribute('data-location');
            if (location) {
                window.location.href = `/rentals/destination/${encodeURIComponent(location)}`;
            }
        });
    });
}
