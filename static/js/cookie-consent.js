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
    // Create overlay to block interaction with the page
    const overlay = document.createElement('div');
    overlay.className = 'cookie-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9998'; // Just below the cookie banner
    document.body.appendChild(overlay);
    
    // Disable all links and buttons except those in the cookie banner
    const links = document.querySelectorAll('a:not(.cookie-banner a)');
    links.forEach(link => {
        link.dataset.originalHref = link.href;
        link.dataset.originalOnclick = link.onclick;
        link.href = 'javascript:void(0)';
        link.onclick = (e) => {
            e.preventDefault();
            alert('Please select your cookie preferences first.');
        };
    });
    
    const buttons = document.querySelectorAll('button:not(.cookie-button)');
    buttons.forEach(button => {
        button.dataset.originalOnclick = button.onclick;
        button.onclick = (e) => {
            e.preventDefault();
            alert('Please select your cookie preferences first.');
        };
    });
    
    // Disable form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.dataset.originalOnsubmit = form.onsubmit;
        form.onsubmit = (e) => {
            e.preventDefault();
            alert('Please select your cookie preferences first.');
        };
    });
}

// Unblock navigation after cookie preferences are set
function unblockNavigation() {
    // Remove overlay
    const overlay = document.querySelector('.cookie-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
    
    // Re-enable links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (link.dataset.originalHref) {
            link.href = link.dataset.originalHref;
            if (link.dataset.originalOnclick) {
                link.onclick = link.dataset.originalOnclick;
            } else {
                link.onclick = null;
            }
        }
    });
    
    // Re-enable buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.dataset.originalOnclick) {
            button.onclick = button.dataset.originalOnclick;
        } else {
            button.onclick = null;
        }
    });
    
    // Re-enable form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.dataset.originalOnsubmit) {
            form.onsubmit = form.dataset.originalOnsubmit;
        } else {
            form.onsubmit = null;
        }
    });
}

function showCookieBanner() {
    // Create cookie banner
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <h3>Cookie Consent</h3>
            <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
            By clicking "Accept All", you consent to our use of cookies.</p>
            
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
                <button id="accept-all-cookies" class="cookie-button accept-all">Accept All</button>
                <button id="reject-all-cookies" class="cookie-button reject-all">Reject All</button>
                <button id="save-preferences-cookies" class="cookie-button save-preferences">Save Preferences</button>
            </div>
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
    // Always track for commercial targeting regardless of analytics consent
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
    if (window.analyticsEnabled) {
        trackVisitorBehavior('page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });
    }
});
