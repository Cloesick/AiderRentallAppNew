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

// Address Autocomplete Functionality with Google Maps Integration
function initializeAddressAutocomplete() {
    const addressInputs = document.querySelectorAll('input[name="address"]');
    
    // Add event listeners for manual address input
    addressInputs.forEach(input => {
        // Create suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'address-suggestions';
        input.parentNode.appendChild(suggestionsContainer);
        
        // Add input event listener
        input.addEventListener('input', function() {
            const query = this.value.trim();
            fetchAddressSuggestions(query, suggestionsContainer, this);
        });
        
        // Add focus event listener
        input.addEventListener('focus', function() {
            const query = this.value.trim();
            if (query.length >= 2) {
                fetchAddressSuggestions(query, suggestionsContainer, this);
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== input && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    });
    
    // Load Google Maps API script if not already loaded
    if (!window.google || !window.google.maps) {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initGoogleMapsAutocomplete';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        // Define the callback function
        window.initGoogleMapsAutocomplete = function() {
            setupAddressAutocomplete(addressInputs);
        };
    } else {
        setupAddressAutocomplete(addressInputs);
    }
}

// Setup Google Maps Places Autocomplete for address inputs
function setupAddressAutocomplete(addressInputs) {
    addressInputs.forEach(input => {
        // Create a new Google Maps Places Autocomplete instance
        const autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['address'],
            fields: ['address_components', 'formatted_address', 'geometry', 'name']
        });
        
        // Store the autocomplete instance on the input element
        input.autocomplete = autocomplete;
        
        // Add a hidden input to store location data
        const locationDataInput = document.createElement('input');
        locationDataInput.type = 'hidden';
        locationDataInput.name = 'location-data';
        locationDataInput.id = input.id + '-location-data';
        input.parentNode.appendChild(locationDataInput);
        
        // Listen for place selection
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                // User entered the name of a place that was not suggested
                return;
            }
            
            // Store location data
            const locationData = {
                address: place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                components: {}
            };
            
            // Extract address components
            place.address_components.forEach(component => {
                const type = component.types[0];
                locationData.components[type] = component.long_name;
                if (type === 'country') {
                    locationData.country_code = component.short_name;
                }
            });
            
            // Store location data in hidden input
            locationDataInput.value = JSON.stringify(locationData);
            
            // Check if the address is in Spain and suggest Spanish location images
            if (locationData.country_code === 'ES') {
                suggestSpanishLocationImages(locationData, input);
            }
        });
    });
}

// Suggest Spanish location images based on address
function suggestSpanishLocationImages(locationData, input) {
    // Get the form that contains this input
    const form = input.closest('form');
    if (!form) return;
    
    // Find the image upload container
    const imageUploadContainer = form.querySelector('.image-upload-container');
    if (!imageUploadContainer) return;
    
    // Create a suggestion message
    const suggestionMsg = document.createElement('div');
    suggestionMsg.className = 'spanish-location-suggestion';
    suggestionMsg.innerHTML = `
        <p>We detected a Spanish address! Would you like to use one of our Spanish location images?</p>
        <div class="spanish-images-grid"></div>
    `;
    
    // Add Spanish location images
    const imagesGrid = suggestionMsg.querySelector('.spanish-images-grid');
    const locations = ['barcelona', 'madrid', 'valencia', 'seville', 'malaga'];
    
    locations.forEach(location => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'spanish-image-option';
        
        const img = document.createElement('img');
        img.src = `/static/images/spain_locations/${location}.jpg`;
        img.alt = `${location.charAt(0).toUpperCase() + location.slice(1)}`;
        img.className = 'spanish-location-thumbnail';
        
        const label = document.createElement('span');
        label.textContent = img.alt;
        
        imgContainer.appendChild(img);
        imgContainer.appendChild(label);
        imagesGrid.appendChild(imgContainer);
        
        // Add click event to select this image
        imgContainer.addEventListener('click', function() {
            // Create a File object from the image URL
            fetch(img.src)
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], `${location}.jpg`, { type: 'image/jpeg' });
                    
                    // Get the preview area
                    const previewArea = imageUploadContainer.querySelector('.image-preview-area');
                    const imageDataInput = imageUploadContainer.querySelector('input[name="image-data"]');
                    
                    if (previewArea && imageDataInput) {
                        // Clear existing previews
                        previewArea.innerHTML = '';
                        
                        // Create a preview item
                        const previewItem = document.createElement('div');
                        previewItem.className = 'image-preview-item';
                        
                        // Create image element
                        const previewImg = document.createElement('img');
                        previewImg.className = 'preview-image';
                        previewImg.src = img.src;
                        
                        // Create remove button
                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'remove-image-button';
                        removeBtn.textContent = '×';
                        
                        // Add elements to preview item
                        previewItem.appendChild(previewImg);
                        previewItem.appendChild(removeBtn);
                        
                        // Add preview item to preview area
                        previewArea.appendChild(previewItem);
                        
                        // Update image data input
                        updateImageDataInput(imageDataInput, previewArea);
                        
                        // Add remove button event
                        removeBtn.addEventListener('click', function() {
                            previewArea.removeChild(previewItem);
                            updateImageDataInput(imageDataInput, previewArea);
                        });
                    }
                });
            
            // Remove the suggestion message
            imageUploadContainer.removeChild(suggestionMsg);
        });
    });
    
    // Add the suggestion message to the image upload container
    imageUploadContainer.appendChild(suggestionMsg);
}

// For demo purposes, we'll also keep a simplified version that works without the API key
function fetchAddressSuggestions(query, container, input) {
    // Check if Google Maps API is loaded
    if (window.google && window.google.maps) {
        // Google Maps API is handling this
        return;
    }
    
    // Only show suggestions if query is at least 2 characters
    if (query.length < 2) {
        container.style.display = 'none';
        return;
    }
    
    // Fallback to mock data if Google Maps API is not available
    const mockSuggestions = [
        query + ", Madrid, Spain",
        query + ", Barcelona, Spain",
        query + ", Valencia, Spain",
        query + ", Seville, Spain",
        query + ", Malaga, Spain",
        query + ", New York, NY, USA",
        query + ", Los Angeles, CA, USA",
        query + ", London, UK",
        query + ", Paris, France",
        query + ", Tokyo, Japan"
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
            
            // Check if the address is in Spain
            if (suggestion.includes('Spain')) {
                const locationData = {
                    address: suggestion,
                    country_code: 'ES'
                };
                suggestSpanishLocationImages(locationData, input);
            }
        });
        
        container.appendChild(item);
    });
    
    container.style.display = 'block';
}

// Price Regionalization and Currency Conversion Functionality
function initializePriceRegionalization() {
    const priceInputs = document.querySelectorAll('input[name="price"]');
    
    // Get user's region and exchange rates
    Promise.all([getUserRegion(), getExchangeRates()]).then(([region, rates]) => {
        // Store exchange rates globally
        window.exchangeRates = rates;
        
        priceInputs.forEach(input => {
            // Add currency symbol based on region
            const currencySymbol = getCurrencySymbol(region);
            input.placeholder = input.placeholder.replace(/[$€£¥₹]/, currencySymbol);
            
            // Add data attribute for region
            input.dataset.region = region;
            input.dataset.currency = getCurrencyCode(region);
            
            // Add helper text
            const helperText = document.createElement('small');
            helperText.textContent = `Prices shown in ${getCurrencyName(region)}`;
            helperText.style.display = 'block';
            helperText.style.marginTop = '5px';
            helperText.style.color = '#666';
            input.parentNode.appendChild(helperText);
            
            // Add currency converter dropdown
            addCurrencyConverter(input, region);
        });
        
        // Also update displayed prices on the page
        updateDisplayedPrices(region);
    });
}

// Add currency converter dropdown next to price input
function addCurrencyConverter(input, userRegion) {
    const userCurrency = getCurrencyCode(userRegion);
    
    // Create container
    const converterContainer = document.createElement('div');
    converterContainer.className = 'currency-converter';
    converterContainer.style.marginTop = '10px';
    
    // Create dropdown
    const currencySelect = document.createElement('select');
    currencySelect.className = 'currency-select';
    
    // Add options for top 10 currencies
    const currencies = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'CHF', name: 'Swiss Franc' },
        { code: 'CNY', name: 'Chinese Yuan' },
        { code: 'HKD', name: 'Hong Kong Dollar' },
        { code: 'NZD', name: 'New Zealand Dollar' }
    ];
    
    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.name} (${currency.code})`;
        if (currency.code === userCurrency) {
            option.selected = true;
        }
        currencySelect.appendChild(option);
    });
    
    // Create converted price display
    const convertedPrice = document.createElement('div');
    convertedPrice.className = 'converted-price';
    convertedPrice.style.marginTop = '5px';
    convertedPrice.style.fontWeight = 'bold';
    
    // Add elements to container
    converterContainer.appendChild(document.createTextNode('Show price in: '));
    converterContainer.appendChild(currencySelect);
    converterContainer.appendChild(convertedPrice);
    
    // Add container after the input
    input.parentNode.appendChild(converterContainer);
    
    // Add event listener to update converted price
    input.addEventListener('input', function() {
        updateConvertedPrice(input, currencySelect, convertedPrice);
    });
    
    currencySelect.addEventListener('change', function() {
        updateConvertedPrice(input, currencySelect, convertedPrice);
    });
    
    // Initial update
    updateConvertedPrice(input, currencySelect, convertedPrice);
}

// Update converted price display
function updateConvertedPrice(input, currencySelect, displayElement) {
    const value = parseFloat(input.value.replace(/[^0-9.]/g, ''));
    if (isNaN(value)) {
        displayElement.textContent = '';
        return;
    }
    
    const sourceCurrency = input.dataset.currency || 'USD';
    const targetCurrency = currencySelect.value;
    
    if (sourceCurrency === targetCurrency) {
        displayElement.textContent = '';
        return;
    }
    
    const convertedValue = convertCurrency(value, sourceCurrency, targetCurrency);
    const symbol = getCurrencySymbolFromCode(targetCurrency);
    
    displayElement.textContent = `${symbol}${convertedValue.toFixed(2)} ${targetCurrency}`;
}

// Update all displayed prices on the page
function updateDisplayedPrices(userRegion) {
    const userCurrency = getCurrencyCode(userRegion);
    const priceElements = document.querySelectorAll('.price');
    
    priceElements.forEach(element => {
        const originalText = element.textContent;
        const priceMatch = originalText.match(/([€$£¥₹])\s*([0-9,]+(\.[0-9]+)?)/);
        
        if (priceMatch) {
            const originalSymbol = priceMatch[1];
            const originalValue = parseFloat(priceMatch[2].replace(/,/g, ''));
            const originalCurrency = getCurrencyCodeFromSymbol(originalSymbol);
            
            if (originalCurrency !== userCurrency) {
                const convertedValue = convertCurrency(originalValue, originalCurrency, userCurrency);
                const userSymbol = getCurrencySymbol(userRegion);
                
                // Create a tooltip with the original price
                element.setAttribute('title', `Original price: ${originalText}`);
                
                // Update the displayed price
                element.innerHTML = `${userSymbol}${convertedValue.toFixed(2)} <small>(${originalText})</small>`;
            }
        }
    });
}

// Convert currency using exchange rates
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (!window.exchangeRates || !window.exchangeRates.rates) {
        return amount; // Fallback if rates not available
    }
    
    const rates = window.exchangeRates.rates;
    
    // Convert to USD first (base currency)
    let inUSD = amount;
    if (fromCurrency !== 'USD') {
        inUSD = amount / rates[fromCurrency];
    }
    
    // Convert from USD to target currency
    if (toCurrency === 'USD') {
        return inUSD;
    }
    
    return inUSD * rates[toCurrency];
}

// Get user's region using IP geolocation
async function getUserRegion() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return data.country || 'US';
    } catch (error) {
        console.error('Error detecting region:', error);
        return 'US'; // Default to US if detection fails
    }
}

// Get current exchange rates
async function getExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        return await response.json();
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return mock exchange rates as fallback
        return {
            base: 'USD',
            rates: {
                USD: 1,
                EUR: 0.85,
                JPY: 110.2,
                GBP: 0.72,
                AUD: 1.35,
                CAD: 1.25,
                CHF: 0.92,
                CNY: 6.45,
                HKD: 7.78,
                NZD: 1.41
            }
        };
    }
}

// Get currency symbol based on region
function getCurrencySymbol(region) {
    const symbols = {
        'US': '$',
        'CA': 'CA$',
        'GB': '£',
        'EU': '€',
        'DE': '€',
        'FR': '€',
        'ES': '€',
        'IT': '€',
        'JP': '¥',
        'CN': '¥',
        'IN': '₹',
        'AU': 'A$',
        'NZ': 'NZ$',
        'CH': 'CHF',
        'HK': 'HK$'
    };
    
    return symbols[region] || '$';
}

// Get currency code based on region
function getCurrencyCode(region) {
    const codes = {
        'US': 'USD',
        'CA': 'CAD',
        'GB': 'GBP',
        'EU': 'EUR',
        'DE': 'EUR',
        'FR': 'EUR',
        'ES': 'EUR',
        'IT': 'EUR',
        'JP': 'JPY',
        'CN': 'CNY',
        'IN': 'INR',
        'AU': 'AUD',
        'NZ': 'NZD',
        'CH': 'CHF',
        'HK': 'HKD'
    };
    
    return codes[region] || 'USD';
}

// Get currency name based on region
function getCurrencyName(region) {
    const names = {
        'US': 'US Dollars (USD)',
        'CA': 'Canadian Dollars (CAD)',
        'GB': 'British Pounds (GBP)',
        'EU': 'Euros (EUR)',
        'DE': 'Euros (EUR)',
        'FR': 'Euros (EUR)',
        'ES': 'Euros (EUR)',
        'IT': 'Euros (EUR)',
        'JP': 'Japanese Yen (JPY)',
        'CN': 'Chinese Yuan (CNY)',
        'IN': 'Indian Rupees (INR)',
        'AU': 'Australian Dollars (AUD)',
        'NZ': 'New Zealand Dollars (NZD)',
        'CH': 'Swiss Francs (CHF)',
        'HK': 'Hong Kong Dollars (HKD)'
    };
    
    return names[region] || 'US Dollars (USD)';
}

// Get currency code from symbol
function getCurrencyCodeFromSymbol(symbol) {
    const codes = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        '₹': 'INR',
        'CA$': 'CAD',
        'A$': 'AUD',
        'NZ$': 'NZD',
        'CHF': 'CHF',
        'HK$': 'HKD'
    };
    
    return codes[symbol] || 'USD';
}

// Get currency symbol from code
function getCurrencySymbolFromCode(code) {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'INR': '₹',
        'CAD': 'CA$',
        'AUD': 'A$',
        'NZD': 'NZ$',
        'CHF': 'CHF',
        'HKD': 'HK$',
        'CNY': '¥'
    };
    
    return symbols[code] || '$';
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
