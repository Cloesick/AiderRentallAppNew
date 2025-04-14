// Property management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize image upload functionality
    initializeImageUpload();
    
    // Initialize address autocomplete
    initializeAddressAutocomplete();
    
    // Initialize price regionalization
    initializePriceRegionalization();
});

// Image Upload Functionality
function initializeImageUpload() {
    const propertyForms = document.querySelectorAll('.property-form');
    
    propertyForms.forEach(form => {
        const category = form.getAttribute('data-category');
        const imageUploadContainer = form.querySelector('.image-upload-container');
        
        if (imageUploadContainer) {
            // Create image preview area
            const previewArea = document.createElement('div');
            previewArea.className = 'image-preview-area';
            imageUploadContainer.appendChild(previewArea);
            
            // Create add image button
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'add-image-button';
            addButton.textContent = 'Add Image';
            imageUploadContainer.appendChild(addButton);
            
            // Create hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.style.display = 'none';
            fileInput.className = 'property-image-input';
            fileInput.name = 'property-images';
            imageUploadContainer.appendChild(fileInput);
            
            // Create hidden input to store image data
            const imageDataInput = document.createElement('input');
            imageDataInput.type = 'hidden';
            imageDataInput.name = 'image-data';
            imageDataInput.id = `${category}-image-data`;
            imageUploadContainer.appendChild(imageDataInput);
            
            // Add click event to button
            addButton.addEventListener('click', function() {
                fileInput.click();
            });
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                handleImageSelection(this.files, previewArea, imageDataInput);
            });
        }
    });
}

// Handle image selection and preview
function handleImageSelection(files, previewArea, imageDataInput) {
    // Check if we already have 8 images
    const existingImages = previewArea.querySelectorAll('.image-preview-item');
    if (existingImages.length + files.length > 8) {
        alert('You can only upload up to 8 images per property.');
        return;
    }
    
    // Process each file
    Array.from(files).forEach(file => {
        // Create a preview item
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        
        // Create image element
        const img = document.createElement('img');
        img.className = 'preview-image';
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-image-button';
        removeBtn.textContent = '×';
        
        // Add elements to preview item
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        
        // Add preview item to preview area
        previewArea.appendChild(previewItem);
        
        // Read file and set image source
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            
            // Store image data
            updateImageDataInput(imageDataInput, previewArea);
        };
        reader.readAsDataURL(file);
        
        // Add remove button event
        removeBtn.addEventListener('click', function() {
            previewArea.removeChild(previewItem);
            updateImageDataInput(imageDataInput, previewArea);
        });
    });
}

// Update the hidden input with image data
function updateImageDataInput(input, previewArea) {
    const images = previewArea.querySelectorAll('.preview-image');
    const imageData = Array.from(images).map(img => img.src);
    input.value = JSON.stringify(imageData);
}

// Address Autocomplete Functionality
function initializeAddressAutocomplete() {
    const addressInputs = document.querySelectorAll('input[name="address"]');
    
    addressInputs.forEach(input => {
        // Create suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'address-suggestions';
        input.parentNode.appendChild(suggestionsContainer);
        
        // Add input event
        input.addEventListener('input', function() {
            const query = this.value.trim();
            if (query.length > 3) {
                fetchAddressSuggestions(query, suggestionsContainer, input);
            } else {
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== input && e.target !== suggestionsContainer) {
                suggestionsContainer.style.display = 'none';
            }
        });
    });
}

// Fetch address suggestions
function fetchAddressSuggestions(query, container, input) {
    // In a real app, this would call an API like Google Places API
    // For demo purposes, we'll use some mock data
    const mockSuggestions = [
        query + ", New York, NY, USA",
        query + ", Los Angeles, CA, USA",
        query + ", Chicago, IL, USA",
        query + ", Houston, TX, USA",
        query + ", Phoenix, AZ, USA"
    ];
    
    // Display suggestions
    container.innerHTML = '';
    mockSuggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        
        item.addEventListener('click', function() {
            input.value = suggestion;
            container.style.display = 'none';
        });
        
        container.appendChild(item);
    });
    
    container.style.display = 'block';
}

// Price Regionalization Functionality
function initializePriceRegionalization() {
    const priceInputs = document.querySelectorAll('input[name="price"]');
    
    // Get user's region
    getUserRegion().then(region => {
        priceInputs.forEach(input => {
            // Add currency symbol based on region
            const currencySymbol = getCurrencySymbol(region);
            input.placeholder = input.placeholder.replace('$', currencySymbol);
            
            // Add data attribute for region
            input.dataset.region = region;
            
            // Add helper text
            const helperText = document.createElement('small');
            helperText.textContent = `Prices shown in ${getCurrencyName(region)}`;
            helperText.style.display = 'block';
            helperText.style.marginTop = '5px';
            helperText.style.color = '#666';
            input.parentNode.appendChild(helperText);
        });
    });
}

// Get user's region (in a real app, this would use geolocation or IP-based detection)
async function getUserRegion() {
    // Mock function - in reality would call an API
    return new Promise(resolve => {
        setTimeout(() => {
            // Default to US for demo
            resolve('US');
        }, 500);
    });
}

// Get currency symbol based on region
function getCurrencySymbol(region) {
    const symbols = {
        'US': '$',
        'GB': '£',
        'EU': '€',
        'JP': '¥',
        'IN': '₹'
    };
    
    return symbols[region] || '$';
}

// Get currency name based on region
function getCurrencyName(region) {
    const names = {
        'US': 'US Dollars (USD)',
        'GB': 'British Pounds (GBP)',
        'EU': 'Euros (EUR)',
        'JP': 'Japanese Yen (JPY)',
        'IN': 'Indian Rupees (INR)'
    };
    
    return names[region] || 'US Dollars (USD)';
}

// Submit property form with additional data
function submitPropertyForm(form, category) {
    // Gather form data
    const formData = new FormData(form);
    const propertyData = {
        name: formData.get('name'),
        address: formData.get('address'),
        description: formData.get('description'),
        price: formData.get('price'),
        squareMeters: formData.get('square-meters'),
        bedrooms: formData.get('bedrooms'),
        bathrooms: formData.get('bathrooms'),
        kitchens: formData.get('kitchens'),
        beds: formData.get('beds'),
        amenities: {},
        category: category // Ensure the category is stored with the property
    };
    
    // Get images
    const imageDataInput = document.getElementById(`${category}-image-data`);
    if (imageDataInput && imageDataInput.value) {
        propertyData.images = JSON.parse(imageDataInput.value);
    } else {
        propertyData.images = [];
    }
    
    // Get all checkboxes
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        propertyData.amenities[checkbox.name] = checkbox.checked;
    });
    
    // Get region data
    const priceInput = form.querySelector('input[name="price"]');
    if (priceInput && priceInput.dataset.region) {
        propertyData.region = priceInput.dataset.region;
    }
    
    // Send data to server
    fetch(`/api/properties/${category}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reset form and reload properties
            form.reset();
            
            // Clear image previews
            const previewArea = form.querySelector('.image-preview-area');
            if (previewArea) {
                previewArea.innerHTML = '';
            }
            
            // Reset image data input
            if (imageDataInput) {
                imageDataInput.value = '';
            }
            
            loadProperties(category);
            alert('Property added successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error adding property:', error);
        alert('An error occurred while adding the property.');
    });
}
