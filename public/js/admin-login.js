document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin login script loaded');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('Attempting login with username:', username);
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Login result:', result);
            
            if (result.success) {
                console.log('Login successful, redirecting...');
                window.location.href = '/admin/dashboard';            } else {
                console.log('Login failed:', result.message);
                loginError.style.display = 'block';
                loginError.textContent = result.message || 'Kredensial tidak valid';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.style.display = 'block';
            loginError.textContent = 'Login gagal. Silakan coba lagi.';
        }
    });
    
    // Hide error message when user starts typing
    document.getElementById('username').addEventListener('input', function() {
        loginError.style.display = 'none';
    });
    
    document.getElementById('password').addEventListener('input', function() {
        loginError.style.display = 'none';
    });
});
