document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
          // Simulate sending message (in a real app, this would send to server)
        alert(`Terima kasih atas pesan Anda, ${formData.name}! Kami akan menghubungi Anda dalam 24 jam.`);
        
        // Reset form
        contactForm.reset();
    });
});
