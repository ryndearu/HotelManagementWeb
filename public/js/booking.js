document.addEventListener('DOMContentLoaded', function() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const roomsContainer = document.getElementById('roomsContainer');
    const bookingModal = document.getElementById('bookingModal');
    const successModal = document.getElementById('successModal');
    const bookingForm = document.getElementById('bookingForm');
    const closeBtns = document.querySelectorAll('.close');
    
    let selectedRoom = null;
    let rooms = [];
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;
    checkOutInput.min = today;
    
    // Update checkout minimum when checkin changes
    checkInInput.addEventListener('change', function() {
        const checkInDate = new Date(this.value);
        checkInDate.setDate(checkInDate.getDate() + 1);
        checkOutInput.min = checkInDate.toISOString().split('T')[0];
        
        if (checkOutInput.value && new Date(checkOutInput.value) <= new Date(this.value)) {
            checkOutInput.value = '';
        }
        
        loadRooms();
    });
    
    checkOutInput.addEventListener('change', loadRooms);
    
    // Load rooms from server
    async function loadRooms() {
        try {
            const response = await fetch('/api/rooms');
            rooms = await response.json();
            displayRooms();
        } catch (error) {
            console.error('Error loading rooms:', error);
            roomsContainer.innerHTML = '<p class="error">Failed to load rooms. Please try again.</p>';
        }
    }
      // Display rooms
    function displayRooms() {
        if (!checkInInput.value || !checkOutInput.value) {
            roomsContainer.innerHTML = '<p>Silakan pilih tanggal check-in dan check-out untuk melihat kamar yang tersedia.</p>';
            return;
        }
        
        const availableRooms = rooms.filter(room => !room.occupied);
        
        if (availableRooms.length === 0) {
            roomsContainer.innerHTML = '<p>Tidak ada kamar tersedia untuk tanggal yang dipilih.</p>';
            return;
        }
        
        roomsContainer.innerHTML = availableRooms.map(room => `
            <div class="room-card">
                <div class="room-image">
                    <span>Kamar ${room.type}</span>
                </div>
                <div class="room-details">
                    <div class="room-type">Kamar ${room.type}</div>
                    <div class="room-price">$${room.price}/malam</div>
                    <div class="room-description">${room.description}</div>
                    <button class="btn btn-primary" onclick="selectRoom(${room.id})">
                        Pesan Kamar Ini
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Select room for booking
    window.selectRoom = function(roomId) {
        selectedRoom = rooms.find(room => room.id === roomId);
        if (selectedRoom) {
            showBookingModal();
        }
    };
    
    // Show booking modal
    function showBookingModal() {
        const checkInDate = new Date(checkInInput.value);
        const checkOutDate = new Date(checkOutInput.value);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalCost = nights * selectedRoom.price;        
        document.getElementById('bookingSummary').innerHTML = `
            <p><strong>Kamar:</strong> ${selectedRoom.type}</p>
            <p><strong>Check-in:</strong> ${checkInInput.value}</p>
            <p><strong>Check-out:</strong> ${checkOutInput.value}</p>
            <p><strong>Malam:</strong> ${nights}</p>
            <p><strong>Tarif:</strong> $${selectedRoom.price}/malam</p>
            <p><strong>Total Biaya:</strong> $${totalCost}</p>
        `;
        
        bookingModal.style.display = 'block';
    }
    
    // Handle booking form submission
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const bookingData = {
            roomId: selectedRoom.id,
            checkIn: checkInInput.value,
            checkOut: checkOutInput.value,
            guestName: document.getElementById('guestName').value,
            guestEmail: document.getElementById('guestEmail').value,
            guestPhone: document.getElementById('guestPhone').value
        };
        
        try {
            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });
            
            const result = await response.json();
              if (result.success) {
                bookingModal.style.display = 'none';
                showSuccessModal(result.booking);
            } else {
                alert('Booking gagal: ' + result.error);
            }
        } catch (error) {
            console.error('Error making booking:', error);
            alert('Booking gagal. Silakan coba lagi.');
        }
    });
      // Show success modal
    function showSuccessModal(booking) {
        document.getElementById('confirmationDetails').innerHTML = `
            <div class="confirmation-details">
                <p><strong>ID Booking:</strong> ${booking.id}</p>
                <p><strong>Nama Tamu:</strong> ${booking.guestName}</p>
                <p><strong>Tipe Kamar:</strong> ${booking.roomType}</p>
                <p><strong>Check-in:</strong> ${booking.checkIn}</p>
                <p><strong>Check-out:</strong> ${booking.checkOut}</p>
                <p><strong>Total Malam:</strong> ${booking.nights}</p>
                <p><strong>Total Biaya:</strong> $${booking.totalCost}</p>
                <p class="success-message">Booking Anda telah dikonfirmasi! Silakan simpan ID booking Anda untuk referensi.</p>
            </div>
        `;
        successModal.style.display = 'block';
    }
    
    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            bookingModal.style.display = 'none';
            successModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
    
    // Format card number input
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue !== e.target.value) {
            e.target.value = formattedValue;
        }
    });
    
    // Format expiry date input
    document.getElementById('expiryDate').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    
    // Format CVV input
    document.getElementById('cvv').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
    
    // Load rooms on page load
    loadRooms();
});
