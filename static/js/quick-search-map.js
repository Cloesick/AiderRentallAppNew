// Global variables
let map;
let searchMarker;
let propertyMarkers = [];
let geocoder;
let infoWindow;
let autocomplete;
let sampleProperties = []; // Will store our sample property data

// Initialize the map
function initMap() {
    // Default location (can be set to a popular city in your target market)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
    
    // Create map centered at the default location
    map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 12,
        center: defaultLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
            {
                "featureType": "poi",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "transit",
                "stylers": [{ "visibility": "simplified" }]
            }
        ]
    });
    
    // Create geocoder for address lookup
    geocoder = new google.maps.Geocoder();
    
    // Create info window for property details
    infoWindow = new google.maps.InfoWindow();
    
    // Add event listener to search button
    document.getElementById("search-button").addEventListener("click", performSearch);
    
    // Add event listener for enter key in search input
    document.getElementById("location-search").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            performSearch();
        }
    });
    
    // Create initial marker at default location
    searchMarker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        animation: google.maps.Animation.DROP,
        title: "Search location",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 0.7,
            strokeColor: "#ffffff",
            strokeWeight: 2
        }
    });
    
    // Initialize Places Autocomplete
    const input = document.getElementById("location-search");
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["geocode"],
        fields: ["geometry", "formatted_address", "name"]
    });
    
    // When a place is selected from autocomplete
    autocomplete.addListener("place_changed", function() {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            // User entered a place that was not suggested
            return;
        }
        
        // Center map on selected place
        map.setCenter(place.geometry.location);
        searchMarker.setPosition(place.geometry.location);
        
        // Perform search with the selected place
        fetchPropertiesNearLocation(place.geometry.location);
    });
    
    // Generate sample property data
    generateSampleProperties(defaultLocation);
}

// Perform search based on user input
function performSearch() {
    const address = document.getElementById("location-search").value;
    
    if (!address) {
        alert("Please enter a location to search");
        return;
    }
    
    // Use geocoder to convert address to coordinates
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results[0]) {
            // Center map on the result
            map.setCenter(results[0].geometry.location);
            
            // Update search marker
            searchMarker.setPosition(results[0].geometry.location);
            
            // Show info window with formatted address
            infoWindow.setContent(`
                <div style="padding: 5px;">
                    <strong>${results[0].formatted_address}</strong>
                    <p style="margin: 5px 0 0;">Showing properties in this area</p>
                </div>
            `);
            infoWindow.open(map, searchMarker);
            
            // Fetch properties near this location
            fetchPropertiesNearLocation(results[0].geometry.location);
        } else {
            alert("Location not found. Please try a different search term.");
        }
    });
}

// Generate sample properties for demonstration
function generateSampleProperties(centerLocation) {
    const propertyTypes = ["Apartment", "House", "Condo", "Villa", "Townhouse"];
    const streets = ["Main St", "Oak Ave", "Maple Rd", "Broadway", "Park Ave", "5th Ave", "Ocean Dr"];
    
    sampleProperties = [];
    
    // Generate 20 random properties
    for (let i = 0; i < 20; i++) {
        // Create a random location within ~2km of the center
        const lat = centerLocation.lat + (Math.random() - 0.5) * 0.04;
        const lng = centerLocation.lng + (Math.random() - 0.5) * 0.04;
        
        const streetNumber = Math.floor(Math.random() * 1000) + 1;
        const streetName = streets[Math.floor(Math.random() * streets.length)];
        const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
        const bedrooms = Math.floor(Math.random() * 4) + 1;
        const bathrooms = Math.floor(Math.random() * 3) + 1;
        const price = Math.floor(Math.random() * 500000) + 200000;
        
        sampleProperties.push({
            id: i + 1,
            title: `${propertyType} for Sale`,
            address: `${streetNumber} ${streetName}`,
            location: { lat, lng },
            price: price,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            sqft: Math.floor(Math.random() * 2000) + 500,
            image: `https://source.unsplash.com/random/300x200?house,${i}`
        });
    }
}

// Fetch properties near a location
function fetchPropertiesNearLocation(location) {
    // Clear existing property markers
    clearPropertyMarkers();
    
    // In a real application, this would make an AJAX request to your server
    console.log("Searching for properties near:", location.lat(), location.lng());
    
    // For demonstration, we'll filter our sample properties by distance
    const nearbyProperties = findNearbyProperties(location, 3); // Within 3km
    
    // Update the results count
    document.getElementById("results-count").textContent = `(${nearbyProperties.length})`;
    
    // Display the properties on the map and in the list
    displayProperties(nearbyProperties);
}

// Find properties within a certain distance (in km)
function findNearbyProperties(location, maxDistance) {
    return sampleProperties.filter(property => {
        const distance = calculateDistance(
            location.lat(), 
            location.lng(), 
            property.location.lat, 
            property.location.lng
        );
        return distance <= maxDistance;
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Display properties on the map and in the list
function displayProperties(properties) {
    const resultsContainer = document.getElementById("property-results");
    
    // Clear existing results
    resultsContainer.innerHTML = "";
    
    if (properties.length === 0) {
        resultsContainer.innerHTML = `<p class="no-results">No properties found in this area</p>`;
        return;
    }
    
    // Add each property to the map and list
    properties.forEach(property => {
        // Add marker to map
        addPropertyMarker(property);
        
        // Add to results list
        const propertyElement = createPropertyElement(property);
        resultsContainer.appendChild(propertyElement);
    });
    
    // Adjust map bounds to show all markers
    adjustMapBounds();
}

// Add a property marker to the map
function addPropertyMarker(property) {
    const marker = new google.maps.Marker({
        position: property.location,
        map: map,
        title: property.title,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4CAF50",
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 1
        }
    });
    
    // Add click event to show property details
    marker.addListener("click", () => {
        showPropertyDetails(property, marker);
    });
    
    // Store the marker for later reference
    propertyMarkers.push(marker);
}

// Clear all property markers from the map
function clearPropertyMarkers() {
    propertyMarkers.forEach(marker => marker.setMap(null));
    propertyMarkers = [];
}

// Adjust map bounds to show all markers
function adjustMapBounds() {
    if (propertyMarkers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Include the search marker
    bounds.extend(searchMarker.getPosition());
    
    // Include all property markers
    propertyMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });
    
    map.fitBounds(bounds);
    
    // Don't zoom in too far
    if (map.getZoom() > 15) {
        map.setZoom(15);
    }
}

// Show property details in an info window
function showPropertyDetails(property, marker) {
    const content = `
        <div style="width: 250px; padding: 5px;">
            <img src="${property.image}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
            <h3 style="margin: 0 0 5px; font-size: 16px;">${property.title}</h3>
            <p style="margin: 0 0 5px; font-size: 14px;">${property.address}</p>
            <p style="margin: 0 0 5px; font-size: 14px; color: #666;">
                ${property.bedrooms} bed • ${property.bathrooms} bath • ${property.sqft} sqft
            </p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #4CAF50;">$${property.price.toLocaleString()}</p>
            <button style="background: #4CAF50; color: white; border: none; padding: 5px 10px; margin-top: 8px; border-radius: 4px; cursor: pointer;">View Details</button>
        </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Create a property element for the results list
function createPropertyElement(property) {
    const element = document.createElement("div");
    element.className = "property-result-item";
    element.innerHTML = `
        <img src="${property.image}" class="property-result-image" alt="${property.title}">
        <div class="property-result-details">
            <h5>${property.title}</h5>
            <p>${property.address}</p>
            <p>${property.bedrooms} bed • ${property.bathrooms} bath</p>
            <p class="property-result-price">$${property.price.toLocaleString()}</p>
        </div>
    `;
    
    // Add click event to show on map
    element.addEventListener("click", () => {
        // Find the corresponding marker
        const marker = propertyMarkers.find(m => 
            m.getPosition().lat() === property.location.lat && 
            m.getPosition().lng() === property.location.lng
        );
        
        if (marker) {
            // Center map on this property
            map.setCenter(marker.getPosition());
            map.setZoom(16);
            
            // Show info window
            showPropertyDetails(property, marker);
        }
    });
    
    return element;
}

// Handle errors loading the Google Maps API
function handleMapError() {
    const mapContainer = document.getElementById("map-container");
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="map-error">
                <p>Unable to load Google Maps. Please check your internet connection and try again.</p>
            </div>
        `;
    }
}

// If Google Maps fails to load
window.gm_authFailure = function() {
    handleMapError();
    console.error("Google Maps authentication failed. Please check your API key.");
};
