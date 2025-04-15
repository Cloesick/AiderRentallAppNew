// Global variables
let map;
let marker;
let geocoder;
let infoWindow;

// Initialize the map
function initMap() {
    // Default location (can be set to a popular city in your target market)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
    
    // Create map centered at the default location
    map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 12,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
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
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        animation: google.maps.Animation.DROP,
        title: "Search location"
    });
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
            
            // Update or create marker
            if (marker) {
                marker.setPosition(results[0].geometry.location);
            } else {
                marker = new google.maps.Marker({
                    position: results[0].geometry.location,
                    map: map,
                    animation: google.maps.Animation.DROP,
                    title: address
                });
            }
            
            // Show info window with formatted address
            infoWindow.setContent(`
                <div>
                    <strong>${results[0].formatted_address}</strong>
                    <p>Click to view properties in this area</p>
                </div>
            `);
            infoWindow.open(map, marker);
            
            // In a real application, you would fetch properties near this location
            // and display them on the map or in a list
            fetchPropertiesNearLocation(results[0].geometry.location);
        } else {
            alert("Location not found. Please try a different search term.");
        }
    });
}

// This function would fetch properties from your backend
function fetchPropertiesNearLocation(location) {
    // In a real application, this would make an AJAX request to your server
    // to get properties near the specified location
    console.log("Searching for properties near:", location.lat(), location.lng());
    
    // For demonstration, we'll just log the action
    // You would replace this with actual API calls to your backend
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
