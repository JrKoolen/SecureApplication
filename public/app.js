const API_BASE = '/api';

let currentToken = localStorage.getItem('token') || null;

function showMessage(message, type = 'error') {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (type === 'error') {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

async function checkPasswordStrength(event) {
    const password = event.target.value;
    
    if (!password) {
        document.getElementById('passwordStrength').style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/check-password-strength`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        const strengthDiv = document.getElementById('passwordStrength');
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        const complexityErrors = document.getElementById('complexityErrors');
        
        strengthDiv.style.display = 'block';
        
        // Update strength bar
        const width = data.strength;
        strengthBar.style.width = `${width}%`;
        
        // Update strength classes
        strengthBar.className = 'strength-bar';
        if (data.strength < 30) strengthBar.classList.add('strength-weak');
        else if (data.strength < 70) strengthBar.classList.add('strength-fair');
        else if (data.strength < 85) strengthBar.classList.add('strength-good');
        else strengthBar.classList.add('strength-strong');
        
        strengthText.textContent = data.feedback;
        
        // Show complexity errors
        if (data.complexity && !data.complexity.isValid) {
            complexityErrors.innerHTML = '<ul>' + data.complexity.errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
            complexityErrors.style.display = 'block';
        } else {
            complexityErrors.style.display = 'none';
        }
    } catch (error) {
        console.error('Password strength check error:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(() => showLogin(), 2000);
        } else {
            if (data.details) {
                showMessage(data.details.join(', '));
            } else {
                showMessage(data.error || 'Registration failed');
            }
        }
    } catch (error) {
        showMessage('Network error. Please try again.');
    }
}

// Store email and password for 2FA verification
let pendingEmail = '';
let pendingPassword = '';

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Store for potential 2FA verification
    pendingEmail = email;
    pendingPassword = password;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            showMessage(text || 'Login failed');
            return;
        }
        
        if (response.ok) {
            // No 2FA, proceed to dashboard
            currentToken = data.token;
            localStorage.setItem('token', currentToken);
            
            if (data.suspiciousLogin) {
                showMessage('Suspicious login detected from a different location.', 'error');
            }
            
            showDashboard(data.user);
        } else if (data.requiresTwoFactor) {
            // 2FA required, show verification form
            showTwoFactorForm();
        } else {
            // Error without 2FA requirement
            showMessage(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again.');
    }
}

async function handle2FAVerification(event) {
    event.preventDefault();
    
    const twoFactorCode = document.getElementById('twoFactorInput').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: pendingEmail, 
                password: pendingPassword,
                twoFactorCode: twoFactorCode
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentToken = data.token;
            localStorage.setItem('token', currentToken);
            
            if (data.suspiciousLogin) {
                showMessage('Suspicious login detected from a different location.', 'error');
            }
            
            showDashboard(data.user);
            
            // Clear stored credentials
            pendingEmail = '';
            pendingPassword = '';
        } else {
            showMessage(data.error || 'Invalid 2FA code');
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        showMessage('Network error. Please try again.');
    }
}

function showTwoFactorForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('twoFactorForm').classList.remove('hidden');
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function cancel2FA() {
    document.getElementById('twoFactorForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    pendingEmail = '';
    pendingPassword = '';
}

// Store current user for settings
let currentUser = null;

function showDashboard(user) {
    currentUser = user;
    // Hide auth container
    document.querySelector('.auth-container').style.display = 'none';
    // Hide auth forms
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('twoFactorForm').classList.add('hidden');
    // Show dashboard
    document.getElementById('dashboard').classList.remove('hidden');
}

function logout() {
    currentToken = null;
    localStorage.removeItem('token');
    currentUser = null;
    // Hide dashboard
    document.getElementById('dashboard').classList.add('hidden');
    // Show auth container
    document.querySelector('.auth-container').style.display = 'flex';
    // Hide auth forms
    document.getElementById('twoFactorForm').classList.add('hidden');
    document.getElementById('settingsModal').classList.add('hidden');
    // Show login form
    document.getElementById('loginForm').classList.remove('hidden');
    // Clear inputs
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    pendingEmail = '';
    pendingPassword = '';
}

function openSettings() {
    if (!currentUser) return;
    
    // Populate settings content
    document.getElementById('settingsName').textContent = currentUser.firstName + ' ' + currentUser.lastName;
    document.getElementById('settingsEmail').textContent = currentUser.email;
    document.getElementById('settings2FA').textContent = currentUser.twoFactorEnabled ? 'Yes' : 'No';
    document.getElementById('settingsRole').innerHTML = currentUser.isAdmin ? '<strong>Role:</strong> Administrator' : '';
    
    // Populate actions
    const settingsActions = document.getElementById('settingsActions');
    let actionsHTML = '';
    if (!currentUser.twoFactorEnabled) {
        actionsHTML += '<a href="2fa.html" style="display: block; margin-bottom: 10px;"><button>Setup 2FA</button></a>';
    }
    if (currentUser.isAdmin) {
        actionsHTML += '<a href="admin.html" style="display: block; margin-bottom: 10px;"><button>Admin Panel</button></a>';
    }
    settingsActions.innerHTML = actionsHTML;
    
    // Show modal
    document.getElementById('settingsModal').classList.remove('hidden');
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
    document.getElementById('settingsModal').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Check if already logged in
if (currentToken) {
    showMessage('Already logged in', 'success');
}
