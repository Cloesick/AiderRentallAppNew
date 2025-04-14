// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar if the element exists
    const calendarContainer = document.querySelector('.calendar-wrapper');
    if (calendarContainer) {
        initializeCalendar(calendarContainer);
    }
    
    // Initialize clock if the element exists
    const clockContainer = document.querySelector('.clock-picker');
    if (clockContainer) {
        initializeClock(clockContainer);
    }
    
    // Initialize filters if they exist
    const filterContainer = document.querySelector('.filter-container');
    if (filterContainer) {
        initializeFilters();
    }
});

function initializeCalendar(container) {
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    renderCalendar(container, currentMonth, currentYear);
    
    // Add event listeners for previous and next month buttons
    const prevMonthBtn = document.querySelector('.prev-month');
    const nextMonthBtn = document.querySelector('.next-month');
    
    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            const monthYear = document.querySelector('.month-year').dataset;
            let month = parseInt(monthYear.month);
            let year = parseInt(monthYear.year);
            
            month--;
            if (month < 0) {
                month = 11;
                year--;
            }
            
            renderCalendar(container, month, year);
        });
        
        nextMonthBtn.addEventListener('click', function() {
            const monthYear = document.querySelector('.month-year').dataset;
            let month = parseInt(monthYear.month);
            let year = parseInt(monthYear.year);
            
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
            
            renderCalendar(container, month, year);
        });
    }
}

function renderCalendar(container, month, year) {
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create calendar header
    let calendarHTML = `
        <div class="calendar-header">
            <button class="prev-month">&lt;</button>
            <div class="month-year" data-month="${month}" data-year="${year}">${monthNames[month]} ${year}</div>
            <button class="next-month">&gt;</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">Su</div>
            <div class="calendar-day-header">Mo</div>
            <div class="calendar-day-header">Tu</div>
            <div class="calendar-day-header">We</div>
            <div class="calendar-day-header">Th</div>
            <div class="calendar-day-header">Fr</div>
            <div class="calendar-day-header">Sa</div>
    `;
    
    // Fill in empty days at the beginning
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="calendar-day disabled"></div>`;
    }
    
    // Fill in the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${year}-${month+1}-${day}">
                ${day}
            </div>
        `;
    }
    
    // Close the grid
    calendarHTML += `</div>`;
    
    // Update the container
    container.innerHTML = calendarHTML;
    
    // Add event listeners to days
    const days = container.querySelectorAll('.calendar-day:not(.disabled)');
    days.forEach(day => {
        day.addEventListener('click', function() {
            // Remove selected class from all days
            days.forEach(d => d.classList.remove('selected'));
            
            // Add selected class to clicked day
            this.classList.add('selected');
            
            // Update the hidden input with the selected date
            const dateInput = document.getElementById('viewing-date') || document.getElementById('visit-date');
            if (dateInput) {
                const dateValue = this.dataset.date;
                dateInput.value = dateValue;
            }
        });
    });
}

function initializeClock(container) {
    // Create clock HTML
    let clockHTML = `
        <div class="clock-center"></div>
        <div class="clock-hand hour-hand"></div>
        <div class="clock-hand minute-hand"></div>
    `;
    
    // Add hour numbers
    for (let i = 1; i <= 12; i++) {
        const angle = (i - 3) * (Math.PI / 6); // Start at 3 o'clock position
        const x = 90 + 80 * Math.cos(angle);
        const y = 100 + 80 * Math.sin(angle);
        
        clockHTML += `
            <div class="clock-number" style="left: ${x}px; top: ${y}px;">${i}</div>
        `;
    }
    
    // Add time display
    clockHTML += `<div class="time-display">12:00</div>`;
    
    // Update the container
    container.innerHTML = clockHTML;
    
    // Set initial time
    updateClockHands(12, 0);
    
    // Make clock interactive
    container.addEventListener('click', function(e) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;
        
        // Calculate angle from center
        let angle = Math.atan2(y, x);
        if (angle < 0) angle += 2 * Math.PI;
        
        // Convert angle to hour (0-11)
        let hour = Math.round(((angle * 6 / Math.PI) + 3) % 12);
        if (hour === 0) hour = 12;
        
        // For simplicity, set minutes to 0 or 30 based on distance from center
        const distance = Math.sqrt(x * x + y * y);
        const isOuterRing = distance > 60;
        const minute = isOuterRing ? 30 : 0;
        
        updateClockHands(hour, minute);
        
        // Update the hidden input with the selected time
        const timeInput = document.getElementById('viewing-time') || document.getElementById('visit-time');
        if (timeInput) {
            const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeInput.value = timeValue;
        }
    });
}

function updateClockHands(hour, minute) {
    // Convert 12-hour format to 24-hour angle
    const hourAngle = ((hour % 12) * 30 + minute * 0.5) - 90;
    const minuteAngle = minute * 6 - 90;
    
    const hourHand = document.querySelector('.hour-hand');
    const minuteHand = document.querySelector('.minute-hand');
    const timeDisplay = document.querySelector('.time-display');
    
    if (hourHand && minuteHand && timeDisplay) {
        hourHand.style.transform = `translateY(-50%) rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `translateY(-50%) rotate(${minuteAngle}deg)`;
        
        // Update time display
        timeDisplay.textContent = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
}

function initializeFilters() {
    // Add event listener to filter button
    const filterButton = document.querySelector('.filter-button');
    if (filterButton) {
        filterButton.addEventListener('click', applyFilters);
    }
    
    // Add event listener to reset button
    const resetButton = document.querySelector('.filter-reset');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
    
    // Add event listeners to price range inputs
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');
    if (minPrice && maxPrice) {
        minPrice.addEventListener('input', validatePriceRange);
        maxPrice.addEventListener('input', validatePriceRange);
    }
}

function applyFilters() {
    const propertyCards = document.querySelectorAll('.property-card');
    if (!propertyCards.length) return;
    
    // Get filter values
    const minPrice = parseFloat(document.getElementById('min-price')?.value || 0);
    const maxPrice = parseFloat(document.getElementById('max-price')?.value || Infinity);
    const propertyType = document.getElementById('property-type')?.value;
    const bedrooms = document.querySelector('input[name="bedrooms"]:checked')?.value;
    
    // Additional filters (checkboxes)
    const hasWashingMachine = document.getElementById('washing-machine')?.checked;
    const hasLaundry = document.getElementById('laundry')?.checked;
    const hasTerrace = document.getElementById('terrace')?.checked;
    const hasBarbecue = document.getElementById('barbecue')?.checked;
    const hasElevator = document.getElementById('elevator')?.checked;
    const hasParking = document.getElementById('parking')?.checked;
    
    // Filter properties
    propertyCards.forEach(card => {
        // Get property data from card
        const priceText = card.querySelector('.price')?.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const description = card.querySelector('p:nth-of-type(1)')?.textContent || '';
        const bedroomsMatch = description.match(/(\d+)\s*bed/);
        const bedroomCount = bedroomsMatch ? parseInt(bedroomsMatch[1]) : 0;
        
        // Apply filters
        let visible = true;
        
        // Price filter
        if (!isNaN(minPrice) && price < minPrice) visible = false;
        if (!isNaN(maxPrice) && price > maxPrice) visible = false;
        
        // Bedrooms filter
        if (bedrooms && bedroomCount !== parseInt(bedrooms)) visible = false;
        
        // Property type filter
        if (propertyType && !card.textContent.toLowerCase().includes(propertyType.toLowerCase())) visible = false;
        
        // Show/hide card
        card.style.display = visible ? 'block' : 'none';
    });
}

function resetFilters() {
    // Reset all filter inputs
    const filterForm = document.querySelector('.filter-container form');
    if (filterForm) {
        filterForm.reset();
    }
    
    // Show all property cards
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        card.style.display = 'block';
    });
}

function validatePriceRange() {
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');
    
    if (minPrice && maxPrice && minPrice.value && maxPrice.value) {
        const min = parseFloat(minPrice.value);
        const max = parseFloat(maxPrice.value);
        
        if (min > max) {
            maxPrice.setCustomValidity('Maximum price must be greater than minimum price');
        } else {
            maxPrice.setCustomValidity('');
        }
    }
}
