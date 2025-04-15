// Targeted Ads System
document.addEventListener('DOMContentLoaded', function() {
    // Load targeted ads based on visitor profile
    loadTargetedAds();
    
    // Track ad impressions
    trackAdImpressions();
});

// Load targeted ads based on visitor profile
function loadTargetedAds() {
    // Get ad containers
    const adContainers = document.querySelectorAll('.ad-container');
    if (adContainers.length === 0) return;
    
    // Fetch visitor profile and available ads
    fetch('/api/visitor-ad-profile')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const profile = data.profile;
                const availableAds = data.available_ads;
                
                // Match ads to profile
                const matchedAds = matchAdsToProfile(profile, availableAds);
                
                // Display ads in containers
                adContainers.forEach((container, index) => {
                    if (index < matchedAds.length) {
                        displayAd(container, matchedAds[index]);
                    } else {
                        displayDefaultAd(container);
                    }
                });
            } else {
                // Display default ads if no profile
                adContainers.forEach(container => {
                    displayDefaultAd(container);
                });
            }
        })
        .catch(error => {
            console.error('Error loading targeted ads:', error);
            // Display default ads on error
            adContainers.forEach(container => {
                displayDefaultAd(container);
            });
        });
}

// Match ads to visitor profile
function matchAdsToProfile(profile, availableAds) {
    if (!profile || !availableAds || availableAds.length === 0) {
        return [];
    }
    
    // Score each ad based on profile match
    const scoredAds = availableAds.map(ad => {
        let score = 0;
        
        // Score based on property types
        if (profile.property_types && ad.property_type) {
            const propertyTypeScore = profile.property_types[ad.property_type] || 0;
            score += propertyTypeScore * 2; // Weight property type higher
        }
        
        // Score based on locations
        if (profile.locations && ad.location) {
            const locationScore = profile.locations[ad.location] || 0;
            score += locationScore * 3; // Weight location even higher
        }
        
        // Score based on price range
        if (profile.price_range && profile.price_range.count > 0 && ad.price) {
            const avgPrice = (profile.price_range.min + profile.price_range.max) / 2;
            const priceDiff = Math.abs(ad.price - avgPrice);
            const priceScore = 100 - Math.min(100, (priceDiff / avgPrice) * 100);
            score += priceScore;
        }
        
        // Score based on interests
        if (profile.interests && ad.tags) {
            const interestMatches = ad.tags.filter(tag => 
                profile.interests.some(interest => 
                    interest.toLowerCase() === tag.toLowerCase()
                )
            ).length;
            
            score += interestMatches * 5; // Weight interests highly
        }
        
        // Score based on recent visits
        if (profile.visits && profile.visits.length > 0) {
            // Give higher scores to ads that match recent page visits
            const recentVisits = profile.visits.slice(0, 10); // Last 10 visits
            
            // Check if any recent visits match the ad's page
            const visitMatch = recentVisits.some(visit => 
                visit.page && ad.target_page && 
                visit.page.includes(ad.target_page)
            );
            
            if (visitMatch) {
                score += 20; // Significant boost for matching recent visit
            }
        }
        
        return {
            ad: ad,
            score: score
        };
    });
    
    // Sort by score (highest first)
    scoredAds.sort((a, b) => b.score - a.score);
    
    // Add some randomness to prevent always showing the same ads
    // Take top 10 ads and randomly select 5 from them, with higher scored ads having higher probability
    const topAds = scoredAds.slice(0, 10);
    const selectedAds = [];
    
    // Select 5 ads or fewer if not enough available
    const numToSelect = Math.min(5, topAds.length);
    
    for (let i = 0; i < numToSelect; i++) {
        // Calculate total remaining score
        const totalScore = topAds.reduce((sum, ad) => sum + ad.score, 0);
        
        if (totalScore <= 0) {
            // If all scores are 0, select randomly
            const randomIndex = Math.floor(Math.random() * topAds.length);
            selectedAds.push(topAds[randomIndex].ad);
            topAds.splice(randomIndex, 1);
        } else {
            // Select based on weighted probability
            let random = Math.random() * totalScore;
            let cumulativeScore = 0;
            
            for (let j = 0; j < topAds.length; j++) {
                cumulativeScore += topAds[j].score;
                if (random <= cumulativeScore) {
                    selectedAds.push(topAds[j].ad);
                    topAds.splice(j, 1);
                    break;
                }
            }
        }
    }
    
    return selectedAds;
}

// Display an ad in a container
function displayAd(container, ad) {
    container.innerHTML = `
        <div class="targeted-ad" data-ad-id="${ad.id}">
            <a href="${ad.url}" target="_blank" class="ad-link" data-ad-id="${ad.id}">
                <img src="${ad.image}" alt="${ad.title}" class="ad-image">
                <div class="ad-content">
                    <h4 class="ad-title">${ad.title}</h4>
                    <p class="ad-description">${ad.description}</p>
                    <span class="ad-cta">${ad.cta || 'Learn More'}</span>
                </div>
            </a>
        </div>
    `;
    
    // Add click event listener
    const adLink = container.querySelector('.ad-link');
    if (adLink) {
        adLink.addEventListener('click', function(e) {
            trackAdClick(ad.id);
        });
    }
}

// Display a default ad
function displayDefaultAd(container) {
    container.innerHTML = `
        <div class="targeted-ad default-ad">
            <a href="/properties" class="ad-link">
                <img src="/static/img/default-ad.jpg" alt="Discover Properties" class="ad-image">
                <div class="ad-content">
                    <h4 class="ad-title">Discover Your Dream Property</h4>
                    <p class="ad-description">Browse our exclusive listings and find your perfect match.</p>
                    <span class="ad-cta">View Properties</span>
                </div>
            </a>
        </div>
    `;
}

// Track ad impressions
function trackAdImpressions() {
    // Use Intersection Observer to track when ads are viewed
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const adElement = entry.target;
                const adId = adElement.dataset.adId;
                
                if (adId) {
                    // Track impression
                    trackVisitorBehavior('ad_impression', {
                        ad_id: adId
                    });
                    
                    // Unobserve after first impression
                    observer.unobserve(adElement);
                }
            }
        });
    }, {
        threshold: 0.5 // Ad must be 50% visible to count as an impression
    });
    
    // Observe all ad elements
    document.querySelectorAll('.targeted-ad').forEach(ad => {
        observer.observe(ad);
    });
}

// Track ad clicks
function trackAdClick(adId) {
    trackVisitorBehavior('ad_click', {
        ad_id: adId
    });
}
