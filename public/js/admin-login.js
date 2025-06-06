document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.location.href = '/admin/dashboard';
            } else {
                loginError.style.display = 'block';
                loginError.textContent = result.message || 'Invalid credentials';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.style.display = 'block';
            loginError.textContent = 'Login failed. Please try again.';
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
