const API_BASE = '/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/';
}

async function fetchWithAuth(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        alert('Session expired. Please login again.');
        logout();
        return null;
    }

    return response;
}

async function loadStats() {
    try {
        const response = await fetchWithAuth('/admin/stats');
        if (!response) return;
        
        const data = await response.json();
        const statsDiv = document.getElementById('stats');
        
        statsDiv.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.activeUsers}</div>
                <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.lockedUsers}</div>
                <div class="stat-label">Locked Accounts</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.twoFactorUsers}</div>
                <div class="stat-label">2FA Enabled</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.recentFailedAttempts}</div>
                <div class="stat-label">Failed Attempts (24h)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.lockPercentage}%</div>
                <div class="stat-label">Lock Rate</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetchWithAuth('/admin/users');
        if (!response) return;
        
        const data = await response.json();
        const usersDiv = document.getElementById('usersTable');
        
        if (data.users.length === 0) {
            usersDiv.innerHTML = '<p>No users found.</p>';
            return;
        }
        
        usersDiv.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>2FA</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.firstName} ${user.lastName}</td>
                            <td>${user.email}</td>
                            <td>
                                <span class="status-badge ${user.isActive ? 'status-active' : 'status-locked'}">
                                    ${user.isActive ? 'Active' : 'Inactive'}
                                </span>
                                ${user.isHardLocked ? '<span class="status-badge status-locked">Hard Locked</span>' : ''}
                                ${user.isSoftLocked ? '<span class="status-badge status-locked">Soft Locked</span>' : ''}
                            </td>
                            <td>
                                <span class="status-badge ${user.twoFactorEnabled ? 'status-2fa' : ''}">
                                    ${user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </td>
                            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                            <td>
                                ${(user.isHardLocked || user.isSoftLocked) ? 
                                    `<button class="btn btn-unlock" onclick="unlockUser(${user.id})">Unlock</button>` : 
                                    ''}
                                <button class="btn btn-reset" onclick="forceReset(${user.id})">Force Reset</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadFailedAttempts() {
    try {
        const response = await fetchWithAuth('/admin/login-attempts/failed?limit=20');
        if (!response) return;
        
        const data = await response.json();
        const attemptsDiv = document.getElementById('failedAttempts');
        
        if (data.attempts.length === 0) {
            attemptsDiv.innerHTML = '<p>No failed attempts found.</p>';
            return;
        }
        
        attemptsDiv.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Email</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.attempts.map(attempt => `
                        <tr>
                            <td>${new Date(attempt.createdAt).toLocaleString()}</td>
                            <td>${attempt.email}</td>
                            <td>${attempt.ipAddress}</td>
                            <td>${attempt.city || 'N/A'}, ${attempt.country || 'N/A'}</td>
                            <td>${attempt.failureReason || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading failed attempts:', error);
    }
}

async function unlockUser(userId) {
    if (!confirm('Unlock this user account?')) return;
    
    try {
        const response = await fetchWithAuth(`/admin/users/${userId}/unlock`, {
            method: 'POST'
        });
        
        if (response && response.ok) {
            alert('Account unlocked successfully');
            loadUsers();
            loadStats();
        } else {
            alert('Failed to unlock account');
        }
    } catch (error) {
        console.error('Error unlocking user:', error);
        alert('Error unlocking account');
    }
}

async function forceReset(userId) {
    if (!confirm('Force this user to reset their password?')) return;
    
    try {
        const response = await fetchWithAuth(`/admin/users/${userId}/force-reset`, {
            method: 'POST'
        });
        
        if (response && response.ok) {
            alert('Password reset forced successfully');
            loadUsers();
        } else {
            alert('Failed to force password reset');
        }
    } catch (error) {
        console.error('Error forcing reset:', error);
        alert('Error forcing password reset');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Load data on page load
loadStats();
loadUsers();
loadFailedAttempts();

// Refresh every 30 seconds
setInterval(() => {
    loadStats();
    loadUsers();
    loadFailedAttempts();
}, 30000);
