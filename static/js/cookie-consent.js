// Cookie Consent Banner
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has already made a cookie choice
    if (!localStorage.getItem('cookieConsent')) {
        showCookieBanner();
        // Block navigation until cookie preferences are set
        blockNavigation();
    } else {
        // Apply saved cookie preferences
        applyCookiePreferences(JSON.parse(localStorage.getItem('cookieConsent')));
    }
});

// Block all navigation until cookie preferences are set
function blockNavigation() {
    // Show the cookie banner prominently
    const cookieBanner = document.querySelector('.cookie-banner');
    if (cookieBanner) {
        cookieBanner.style.zIndex = '9999';
        cookieBanner.style.position = 'fixed';
        cookieBanner.style.top = '50%';
        cookieBanner.style.left = '50%';
        cookieBanner.style.transform = 'translate(-50%, -50%)';
        cookieBanner.style.maxWidth = '500px';
        cookieBanner.style.width = '90%';
        cookieBanner.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
    }
    
    // Create overlay to block interaction with the rest of the page
    const overlay = document.createElement('div');
    overlay.id = 'cookie-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '9998';
    document.body.appendChild(overlay);
    
    // Disable all links on the page
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.dataset.originalHref = link.getAttribute('href');
        link.setAttribute('href', 'javascript:void(0)');
        link.dataset.cookieBlocked = 'true';
        link.addEventListener('click', preventNavigation);
    });
    
    // Disable all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.dataset.originalOnsubmit = form.onsubmit;
        form.onsubmit = function(e) {
            e.preventDefault();
            alert('Please set your cookie preferences to continue.');
            return false;
        };
    });
    
    // Log that cookie preferences are needed
    console.log('Cookie preferences needed - navigation blocked');
}

// Prevent navigation and show message
function preventNavigation(e) {
    e.preventDefault();
    alert('Please set your cookie preferences to continue.');
    return false;
}

// Unblock navigation after cookie preferences are set
function unblockNavigation() {
    // Hide the cookie banner
    const cookieBanner = document.querySelector('.cookie-banner');
    if (cookieBanner) {
        cookieBanner.style.display = 'none';
    }
    
    // Remove overlay
    const overlay = document.getElementById('cookie-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
    
    // Re-enable all links
    const links = document.querySelectorAll('a[data-cookie-blocked="true"]');
    links.forEach(link => {
        if (link.dataset.originalHref) {
            link.setAttribute('href', link.dataset.originalHref);
            link.removeAttribute('data-original-href');
        }
        link.removeAttribute('data-cookie-blocked');
        link.removeEventListener('click', preventNavigation);
    });
    
    // Re-enable all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.dataset.originalOnsubmit) {
            form.onsubmit = form.dataset.originalOnsubmit;
            form.removeAttribute('data-original-onsubmit');
        } else {
            form.onsubmit = null;
        }
    });
    
    console.log('Cookie preferences set - navigation unblocked');
}

function showCookieBanner() {
    // Create cookie banner
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <h3>Cookie Consent Required</h3>
            <p><strong>You must select your cookie preferences to continue.</strong></p>
            <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
            Please select one of the options below to continue to the site.</p>
            
            <div class="cookie-types">
                <div class="cookie-type">
                    <input type="checkbox" id="essential-cookies" checked disabled>
                    <label for="essential-cookies">Essential Cookies</label>
                    <p>These cookies are necessary for the website to function and cannot be switched off.</p>
                </div>
                
                <div class="cookie-type">
                    <input type="checkbox" id="analytics-cookies" checked>
                    <label for="analytics-cookies">Analytics Cookies</label>
                    <p>These cookies allow us to count visits and traffic sources so we can measure and improve site performance.</p>
                </div>
                
                <div class="cookie-type">
                    <input type="checkbox" id="marketing-cookies" checked>
                    <label for="marketing-cookies">Marketing Cookies</label>
                    <p>These cookies help us show you relevant marketing campaigns and advertisements.</p>
                </div>
                
                <div class="cookie-type">
                    <input type="checkbox" id="preference-cookies" checked>
                    <label for="preference-cookies">Preference Cookies</label>
                    <p>These cookies enable personalized content and remember your preferences.</p>
                </div>
            </div>
            
            <div class="cookie-buttons">
                <button id="accept-all-cookies" class="cookie-button accept-all highlight-button">Accept All</button>
                <button id="reject-all-cookies" class="cookie-button reject-all highlight-button">Reject All</button>
                <button id="save-preferences-cookies" class="cookie-button save-preferences highlight-button">Save Preferences</button>
            </div>
            <p class="cookie-notice">You must select one option to continue to the site.</p>
        </div>
    `;
    
    // Add banner to page
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('accept-all-cookies').addEventListener('click', function() {
        const preferences = {
            essential: true,
            analytics: true,
            marketing: true,
            preference: true
        };
        saveCookiePreferences(preferences);
        removeCookieBanner();
    });
    
    document.getElementById('reject-all-cookies').addEventListener('click', function() {
        const preferences = {
            essential: true, // Essential cookies are always enabled
            analytics: false,
            marketing: false,
            preference: false
        };
        saveCookiePreferences(preferences);
        removeCookieBanner();
    });
    
    document.getElementById('save-preferences-cookies').addEventListener('click', function() {
        const preferences = {
            essential: true, // Essential cookies are always enabled
            analytics: document.getElementById('analytics-cookies').checked,
            marketing: document.getElementById('marketing-cookies').checked,
            preference: document.getElementById('preference-cookies').checked
        };
        saveCookiePreferences(preferences);
        removeCookieBanner();
    });
}

function saveCookiePreferences(preferences) {
    // Save preferences to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    
    // Apply preferences
    applyCookiePreferences(preferences);
    
    // Send preferences to server for tracking
    fetch('/api/cookie-preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    }).catch(error => {
        console.error('Error saving cookie preferences:', error);
    });
}

function applyCookiePreferences(preferences) {
    // Apply analytics cookies
    if (preferences.analytics) {
        enableAnalyticsCookies();
    } else {
        disableAnalyticsCookies();
    }
    
    // Apply marketing cookies
    if (preferences.marketing) {
        enableMarketingCookies();
    } else {
        disableMarketingCookies();
    }
    
    // Apply preference cookies
    if (preferences.preference) {
        enablePreferenceCookies();
    } else {
        disablePreferenceCookies();
    }
}

function removeCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.add('hiding');
        setTimeout(() => {
            document.body.removeChild(banner);
            // Unblock navigation after cookie preferences are set
            unblockNavigation();
        }, 500); // Match the transition duration in CSS
        
        // Add a small notification that preferences have been saved
        const notification = document.createElement('div');
        notification.className = 'cookie-notification';
        notification.textContent = 'Cookie preferences saved!';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
}

// Functions to enable/disable different types of cookies
function enableAnalyticsCookies() {
    // In a real app, this would initialize analytics tools like Google Analytics
    window.analyticsEnabled = true;
    console.log('Analytics cookies enabled');
}

function disableAnalyticsCookies() {
    // In a real app, this would disable analytics tools
    window.analyticsEnabled = false;
    console.log('Analytics cookies disabled');
}

function enableMarketingCookies() {
    // In a real app, this would initialize marketing tools
    window.marketingEnabled = true;
    console.log('Marketing cookies enabled');
}

function disableMarketingCookies() {
    // In a real app, this would disable marketing tools
    window.marketingEnabled = false;
    console.log('Marketing cookies disabled');
}

function enablePreferenceCookies() {
    // In a real app, this would enable preference tracking
    window.preferencesEnabled = true;
    console.log('Preference cookies enabled');
}

function disablePreferenceCookies() {
    // In a real app, this would disable preference tracking
    window.preferencesEnabled = false;
    console.log('Preference cookies disabled');
}

// Track visitor behavior for analytics and targeted ads
function trackVisitorBehavior(action, data = {}) {
    // Check if analytics is enabled before tracking
    const cookieConsent = JSON.parse(localStorage.getItem('cookieConsent') || '{"essential":true}');
    
    // Only track if analytics cookies are enabled or if it's essential tracking
    if (!cookieConsent.analytics && action !== 'essential_tracking') {
        console.log('Analytics tracking disabled by user preferences');
        return;
    }
    
    // Add timestamp
    data.timestamp = new Date().toISOString();
    
    // Add current page URL
    data.page = window.location.pathname;
    
    // Add interests based on page content
    data.interests = extractInterestsFromPage();
    
    // Add device info
    data.device = {
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        user_agent: navigator.userAgent
    };
    
    // Add referrer if available
    if (document.referrer) {
        data.referrer = document.referrer;
    }
    
    // Send tracking data to server
    fetch('/api/track-visitor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Current-Page': window.location.pathname
        },
        body: JSON.stringify({
            action: action,
            data: data
        })
    }).catch(error => {
        console.error('Error tracking visitor behavior:', error);
    });
    
    // Log tracking in console during development
    console.log(`Tracked: ${action}`, data);
}

// Extract potential interests from page content
function extractInterestsFromPage() {
    const interests = [];
    const pageContent = document.body.textContent.toLowerCase();
    
    // Check for property types
    const propertyTypes = [
        'apartment', 'house', 'condo', 'villa', 'townhouse', 
        'office', 'retail', 'industrial', 'warehouse', 'commercial',
        'residential', 'penthouse', 'studio', 'duplex', 'loft'
    ];
    propertyTypes.forEach(type => {
        if (pageContent.includes(type)) {
            interests.push(type);
        }
    });
    
    // Check for locations
    const locations = [
        'marbella', 'nice', 'malaga', 'paris', 'luxembourg', 'ibiza', 
        'downtown', 'beachfront', 'suburban', 'urban', 'rural',
        'city center', 'waterfront', 'mountain', 'coastal'
    ];
    locations.forEach(location => {
        if (pageContent.includes(location)) {
            interests.push(location);
        }
    });
    
    // Check for amenities
    const amenities = [
        'pool', 'garden', 'balcony', 'parking', 'garage', 'gym', 
        'security', 'elevator', 'terrace', 'air conditioning', 
        'heating', 'furnished', 'pet friendly', 'doorman', 'concierge'
    ];
    amenities.forEach(amenity => {
        if (pageContent.includes(amenity)) {
            interests.push(amenity);
        }
    });
    
    // Check for price ranges
    const priceRanges = [
        'luxury', 'affordable', 'budget', 'premium', 'exclusive',
        'high-end', 'mid-range', 'economic'
    ];
    priceRanges.forEach(range => {
        if (pageContent.includes(range)) {
            interests.push(range);
        }
    });
    
    // Check for property features
    const features = [
        'modern', 'traditional', 'renovated', 'new construction',
        'historic', 'open floor plan', 'spacious', 'cozy', 'bright'
    ];
    features.forEach(feature => {
        if (pageContent.includes(feature)) {
            interests.push(feature);
        }
    });
    
    // Check for user intent
    const intents = [
        'buy', 'rent', 'lease', 'invest', 'sell', 'visit',
        'schedule', 'tour', 'contact', 'information'
    ];
    intents.forEach(intent => {
        if (pageContent.includes(intent)) {
            interests.push(intent);
        }
    });
    
    return [...new Set(interests)]; // Remove duplicates
}

// Expose tracking function globally
window.trackVisitorBehavior = trackVisitorBehavior;

// Track page view on load
document.addEventListener('DOMContentLoaded', function() {
    // Check if cookie consent exists and analytics is enabled
    const cookieConsent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
    if (cookieConsent.analytics) {
        trackVisitorBehavior('page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });
    }
    
    // Add a small floating button to manage cookie preferences
    if (localStorage.getItem('cookieConsent')) {
        const manageButton = document.createElement('button');
        manageButton.textContent = 'Cookie Settings';
        manageButton.className = 'cookie-manage-button';
        manageButton.style.position = 'fixed';
        manageButton.style.bottom = '20px';
        manageButton.style.left = '20px';
        manageButton.style.padding = '8px 12px';
        manageButton.style.backgroundColor = '#f0f0f0';
        manageButton.style.border = '1px solid #ccc';
        manageButton.style.borderRadius = '4px';
        manageButton.style.cursor = 'pointer';
        manageButton.style.fontSize = '12px';
        manageButton.style.zIndex = '9990';
        
        manageButton.addEventListener('click', function() {
            // Remove existing cookie consent from localStorage
            // but keep a backup to restore if user cancels
            const currentPreferences = localStorage.getItem('cookieConsent');
            localStorage.setItem('cookieConsentBackup', currentPreferences);
            localStorage.removeItem('cookieConsent');
            
            // Show cookie banner again
            showCookieBanner();
            blockNavigation();
            
            // Remove the manage button
            if (manageButton.parentNode) {
                document.body.removeChild(manageButton);
            }
        });
        
        document.body.appendChild(manageButton);
    }
});
