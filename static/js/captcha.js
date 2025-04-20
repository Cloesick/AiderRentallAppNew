// Simple captcha generator and validator
function generateCaptcha() {
    const canvas = document.getElementById('captcha-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const captchaText = generateRandomString(6);
    
    // Store the captcha text in a hidden field
    document.getElementById('captcha-text').value = captchaText;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add noise (background)
    addNoise(ctx, canvas.width, canvas.height);
    
    // Draw the captcha text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw each character with slight rotation for added security
    const textWidth = ctx.measureText(captchaText).width;
    const startX = (canvas.width - textWidth) / 2;
    
    for (let i = 0; i < captchaText.length; i++) {
        const charX = startX + i * (textWidth / captchaText.length) + 10;
        const charY = canvas.height / 2 + (Math.random() * 10 - 5);
        
        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate((Math.random() * 30 - 15) * Math.PI / 180);
        ctx.fillText(captchaText[i], 0, 0);
        ctx.restore();
    }
    
    // Add some lines for noise
    addLines(ctx, canvas.width, canvas.height);
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function addNoise(ctx, width, height) {
    // Add background noise
    for (let i = 0; i < width * height * 0.1; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.1)`;
        ctx.fillRect(x, y, 2, 2);
    }
}

function addLines(ctx, width, height) {
    // Add random lines
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Handle remember me functionality
function handleRememberMe() {
    const rememberMe = document.getElementById('remember-me');
    const emailField = document.getElementById('email');
    
    // Check if we have stored credentials
    if (localStorage.getItem('rememberedEmail')) {
        emailField.value = localStorage.getItem('rememberedEmail');
        rememberMe.checked = true;
    }
    
    // Add event listener to the login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            if (rememberMe.checked) {
                localStorage.setItem('rememberedEmail', emailField.value);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
        });
    }
}

// Initialize captcha and remember me functionality
document.addEventListener('DOMContentLoaded', function() {
    const captchaCanvas = document.getElementById('captcha-canvas');
    if (captchaCanvas) {
        generateCaptcha();
        
        // Add refresh button functionality
        const refreshButton = document.getElementById('refresh-captcha');
        if (refreshButton) {
            refreshButton.addEventListener('click', function(e) {
                e.preventDefault();
                generateCaptcha();
            });
        }
    }
    
    // Initialize remember me functionality
    handleRememberMe();
});
