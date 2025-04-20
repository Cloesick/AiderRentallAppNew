// Enhanced captcha generator and validator
function generateCaptcha() {
    const canvas = document.getElementById('captcha-canvas');
    const regCanvas = document.getElementById('reg-captcha-canvas');
    
    // Handle both login and registration captchas
    if (canvas) generateCaptchaOnCanvas(canvas, 'captcha-text');
    if (regCanvas) generateCaptchaOnCanvas(regCanvas, 'reg-captcha-text');
}

function generateCaptchaOnCanvas(canvas, textFieldId) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const captchaText = generateRandomString(6);
    
    // Store the captcha text in a hidden field
    const textField = document.getElementById(textFieldId);
    if (textField) textField.value = captchaText;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f9f9f9');
    gradient.addColorStop(1, '#e9e9e9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise (background)
    addNoise(ctx, canvas.width, canvas.height);
    
    // Draw the captcha text with varying colors and fonts
    const fonts = ['Arial', 'Verdana', 'Courier New', 'Georgia', 'Tahoma'];
    
    // Draw each character with slight rotation for added security
    const textWidth = ctx.measureText(captchaText).width;
    const startX = (canvas.width - textWidth) / 2;
    
    for (let i = 0; i < captchaText.length; i++) {
        const charX = startX + i * (textWidth / captchaText.length) + 10;
        const charY = canvas.height / 2 + (Math.random() * 10 - 5);
        
        // Random color for each character
        const r = Math.floor(Math.random() * 100);
        const g = Math.floor(Math.random() * 100);
        const b = Math.floor(Math.random() * 100);
        
        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate((Math.random() * 30 - 15) * Math.PI / 180);
        ctx.font = `bold ${20 + Math.floor(Math.random() * 8)}px ${fonts[Math.floor(Math.random() * fonts.length)]}`;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillText(captchaText[i], 0, 0);
        ctx.restore();
    }
    
    // Add some lines for noise
    addLines(ctx, canvas.width, canvas.height);
    
    // Add some dots for noise
    addDots(ctx, canvas.width, canvas.height);
}

function generateRandomString(length) {
    // Exclude confusing characters like 0, O, 1, I, l
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    
    // Add entropy by using crypto API if available
    if (window.crypto && window.crypto.getRandomValues) {
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(randomValues[i] % chars.length);
        }
    } else {
        // Fallback to Math.random
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return result;
}

function addNoise(ctx, width, height) {
    // Add background noise
    for (let i = 0; i < width * height * 0.15; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.1)`;
        ctx.fillRect(x, y, 2, 2);
    }
}

function addLines(ctx, width, height) {
    // Add random lines
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.stroke();
    }
}

function addDots(ctx, width, height) {
    // Add random dots
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const radius = 1 + Math.random() * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
        ctx.fill();
    }
}

// Enhanced remember me functionality with encryption
function handleRememberMe() {
    const rememberMe = document.getElementById('remember-me');
    const emailField = document.getElementById('email');
    
    if (!rememberMe || !emailField) return;
    
    // Check if we have stored credentials
    const encryptedEmail = localStorage.getItem('rememberedEmail');
    if (encryptedEmail) {
        try {
            // Simple XOR decryption with a fixed key
            // In a production app, use a more secure method
            const decryptedEmail = decryptData(encryptedEmail);
            emailField.value = decryptedEmail;
            rememberMe.checked = true;
        } catch (e) {
            console.error('Error decrypting email', e);
            localStorage.removeItem('rememberedEmail');
        }
    }
    
    // Add event listener to the login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            if (rememberMe.checked && emailField.value) {
                // Simple XOR encryption with a fixed key
                // In a production app, use a more secure method
                const encryptedEmail = encryptData(emailField.value);
                localStorage.setItem('rememberedEmail', encryptedEmail);
                
                // Set expiration for the remembered email (30 days)
                const expiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
                localStorage.setItem('rememberedEmailExpires', expiration.toString());
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedEmailExpires');
            }
        });
    }
    
    // Check for expired remembered email
    const expirationTime = localStorage.getItem('rememberedEmailExpires');
    if (expirationTime && parseInt(expirationTime) < Date.now()) {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedEmailExpires');
    }
}

// Simple XOR encryption/decryption
function encryptData(text) {
    // This is a simple implementation - in production use a proper encryption library
    const key = 'REAL_ESTATE_APP_KEY';
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    
    return btoa(result); // Base64 encode the result
}

function decryptData(encryptedText) {
    try {
        const key = 'REAL_ESTATE_APP_KEY';
        const text = atob(encryptedText); // Base64 decode
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        
        return result;
    } catch (e) {
        console.error('Decryption error', e);
        return '';
    }
}

// Initialize captcha and remember me functionality
document.addEventListener('DOMContentLoaded', function() {
    // Generate captchas
    generateCaptcha();
    
    // Add refresh button functionality for login captcha
    const refreshButton = document.getElementById('refresh-captcha');
    if (refreshButton) {
        refreshButton.addEventListener('click', function(e) {
            e.preventDefault();
            generateCaptcha();
        });
    }
    
    // Add refresh button functionality for registration captcha
    const regRefreshButton = document.getElementById('reg-refresh-captcha');
    if (regRefreshButton) {
        regRefreshButton.addEventListener('click', function(e) {
            e.preventDefault();
            generateCaptcha();
        });
    }
    
    // Initialize remember me functionality
    handleRememberMe();
    
    // Add login attempt tracking
    trackLoginAttempts();
});

// Track login attempts to prevent brute force attacks
function trackLoginAttempts() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    // Get current attempt count
    let attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    let lastAttemptTime = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
    
    // Reset attempts if last attempt was more than 30 minutes ago
    if (Date.now() - lastAttemptTime > 30 * 60 * 1000) {
        attempts = 0;
    }
    
    // Add submit event listener
    loginForm.addEventListener('submit', function(e) {
        // Update last attempt time
        localStorage.setItem('lastLoginAttempt', Date.now().toString());
        
        // Increment attempt counter
        attempts++;
        localStorage.setItem('loginAttempts', attempts.toString());
        
        // If too many attempts, show warning and require captcha
        if (attempts >= 3) {
            const captchaContainer = document.querySelector('.captcha-container');
            if (captchaContainer) {
                captchaContainer.style.display = 'block';
            }
            
            // If more than 5 attempts, add delay
            if (attempts >= 5) {
                e.preventDefault();
                const submitButton = loginForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Please wait...';
                    
                    // Add a delay before allowing another attempt
                    setTimeout(() => {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Login';
                        generateCaptcha(); // Generate a new captcha
                    }, 3000); // 3 second delay
                }
            }
        }
    });
}
