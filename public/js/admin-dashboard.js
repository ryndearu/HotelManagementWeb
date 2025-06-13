document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const roomsGrid = document.getElementById('roomsGrid');
    const bookingsTable = document.getElementById('bookingsTable');
    
    let rooms = [];
    let bookings = [];
    
    // Logout functionality
    logoutBtn.addEventListener('click', async function() {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/admin';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    
    // Refresh data
    refreshBtn.addEventListener('click', function() {
        loadDashboardData();
    });
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Load rooms
            const roomsResponse = await fetch('/api/admin/rooms');
            if (roomsResponse.ok) {
                rooms = await roomsResponse.json();
                displayRooms();
                updateStats();
            } else {
                window.location.href = '/admin';
            }
            
            // Load bookings
            const bookingsResponse = await fetch('/api/bookings');
            if (bookingsResponse.ok) {
                bookings = await bookingsResponse.json();
                displayBookings();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            window.location.href = '/admin';
        }
    }
    
    // Update statistics
    function updateStats() {
        const occupiedCount = rooms.filter(room => room.occupied).length;
        const availableCount = rooms.filter(room => !room.occupied && !room.needsCleaning && !room.checkedOut).length;
        const cleaningCount = rooms.filter(room => room.needsCleaning).length;
        const checkedOutCount = rooms.filter(room => room.checkedOut).length;
        
        document.getElementById('occupiedCount').textContent = occupiedCount;
        document.getElementById('availableCount').textContent = availableCount;
        document.getElementById('cleaningCount').textContent = cleaningCount;
        document.getElementById('checkedOutCount').textContent = checkedOutCount;
    }
      // Display rooms
    function displayRooms() {
        roomsGrid.innerHTML = rooms.map(room => {
            let statusClass = 'available';
            let statusText = 'Tersedia';
            
            if (room.occupied) {
                statusClass = 'occupied';
                statusText = 'Terisi';
            } else if (room.needsCleaning) {
                statusClass = 'cleaning';
                statusText = 'Perlu Cleaning';
            } else if (room.checkedOut) {
                statusClass = 'checked-out';
                statusText = 'Sudah Checkout';
            }
            
            return `
                <div class="admin-room-card ${statusClass}">                    <div class="room-header">
                        <div class="room-number">Kamar ${room.id}</div>
                        <div class="room-status status-${statusClass.replace('-', '')}">${statusText}</div>
                    </div>
                    <div class="room-type">${room.type} - $${room.price}/malam</div>
                    <div class="room-controls">
                        <button class="control-btn ${room.occupied ? 'active' : ''}" 
                                onclick="updateRoomStatus(${room.id}, 'occupied', ${!room.occupied})">
                            ${room.occupied ? 'Tandai Tersedia' : 'Tandai Terisi'}
                        </button>
                        <button class="control-btn ${room.needsCleaning ? 'active' : ''}" 
                                onclick="updateRoomStatus(${room.id}, 'needsCleaning', ${!room.needsCleaning})">
                            ${room.needsCleaning ? 'Sudah Dibersihkan' : 'Perlu Cleaning'}
                        </button>
                        <button class="control-btn ${room.checkedOut ? 'active' : ''}" 
                                onclick="updateRoomStatus(${room.id}, 'checkedOut', ${!room.checkedOut})">
                            ${room.checkedOut ? 'Clear Checkout' : 'Tandai Checkout'}
                        </button>
                        <button class="control-btn" 
                                onclick="resetRoom(${room.id})">
                            Reset Kamar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }      // Display bookings
    function displayBookings() {
        if (bookings.length === 0) {
            bookingsTable.innerHTML = '<p>Tidak ada booking ditemukan.</p>';
            return;
        }
        
        // Sort bookings by date (newest first)
        const sortedBookings = bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        const recentBookings = sortedBookings.slice(0, 10); // Show last 10 bookings
        
        bookingsTable.innerHTML = `
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th class="expandable-column">ID Booking</th>
                        <th>Nama Tamu</th>
                        <th>Kamar</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Total Biaya</th>
                        <th>Status</th>
                        <th>Checkout</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentBookings.map(booking => {
                        // Find the room to check its checked-out status
                        const room = rooms.find(r => r.id === booking.roomId);
                        const isCheckedOut = room ? room.checkedOut : false;
                        const checkedOutEmoji = isCheckedOut ? '✅' : '❌';
                        
                        return `
                            <tr>
                                <td class="expandable-column" title="${booking.id}">
                                    <span class="booking-id-short">${booking.id.substring(0, 8)}...</span>
                                    <span class="booking-id-full" style="display: none;">${booking.id}</span>
                                </td>
                                <td>${booking.guestName}</td>
                                <td>Kamar ${booking.roomId} (${booking.roomType})</td>
                                <td>${booking.checkIn}</td>
                                <td>${booking.checkOut}</td>
                                <td>$${booking.totalCost}</td>
                                <td><span class="status-${booking.status}">${booking.status}</span></td>
                                <td class="checkout-status" data-room-id="${booking.roomId}">
                                    <span class="checkout-emoji" title="${isCheckedOut ? 'Kamar sudah checkout' : 'Kamar belum checkout'}">${checkedOutEmoji}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        // Add click event listeners for expandable columns
        document.querySelectorAll('.expandable-column').forEach(cell => {
            cell.addEventListener('click', function() {
                const shortSpan = this.querySelector('.booking-id-short');
                const fullSpan = this.querySelector('.booking-id-full');
                
                if (shortSpan && fullSpan) {
                    if (shortSpan.style.display === 'none') {
                        shortSpan.style.display = 'inline';
                        fullSpan.style.display = 'none';
                        this.classList.remove('expanded');
                    } else {
                        shortSpan.style.display = 'none';
                        fullSpan.style.display = 'inline';
                        this.classList.add('expanded');
                    }
                }
            });
        });
    }
      // Update room status
    window.updateRoomStatus = async function(roomId, statusType, value) {
        try {
            const room = rooms.find(r => r.id === roomId);
            const updatedRoom = { ...room };
            updatedRoom[statusType] = value;
            
            const response = await fetch(`/api/admin/rooms/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedRoom)
            });
            
            if (response.ok) {
                // Update local data
                const roomIndex = rooms.findIndex(r => r.id === roomId);
                rooms[roomIndex] = updatedRoom;
                displayRooms();
                updateStats();
                
                // Update the checked-out status in the bookings table without full refresh
                if (statusType === 'checkedOut') {
                    updateCheckoutStatusInTable(roomId, value);
                }
            } else {
                alert('Failed to update room status');
            }
        } catch (error) {
            console.error('Error updating room status:', error);
            alert('Failed to update room status');
        }
    };
    
    // Update checkout status in bookings table without full refresh
    function updateCheckoutStatusInTable(roomId, isCheckedOut) {
        const checkoutCells = document.querySelectorAll(`[data-room-id="${roomId}"] .checkout-emoji`);
        checkoutCells.forEach(cell => {
            const emoji = isCheckedOut ? '✅' : '❌';
            const title = isCheckedOut ? 'Room is checked out' : 'Room is not checked out';
            cell.textContent = emoji;
            cell.title = title;
        });
    }
    
    // Reset room to available state
    window.resetRoom = async function(roomId) {
        if (confirm('Are you sure you want to reset this room to available state?')) {
            try {
                const room = rooms.find(r => r.id === roomId);
                const updatedRoom = {
                    ...room,
                    occupied: false,
                    needsCleaning: false,
                    checkedOut: false
                };
                
                const response = await fetch(`/api/admin/rooms/${roomId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedRoom)
                });
                
                if (response.ok) {
                    // Update local data
                    const roomIndex = rooms.findIndex(r => r.id === roomId);
                    rooms[roomIndex] = updatedRoom;
                    displayRooms();
                    updateStats();
                } else {
                    alert('Failed to reset room');
                }
            } catch (error) {
                console.error('Error resetting room:', error);
                alert('Failed to reset room');
            }
        }
    };
    
    // Load initial data
    loadDashboardData();
});
