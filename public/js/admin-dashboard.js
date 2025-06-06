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
        const occupied = rooms.filter(room => room.occupied).length;
        const available = rooms.filter(room => !room.occupied && !room.needsCleaning && !room.checkedOut).length;
        const cleaning = rooms.filter(room => room.needsCleaning).length;
        const checkedOut = rooms.filter(room => room.checkedOut).length;
        
        document.getElementById('occupiedCount').textContent = occupied;
        document.getElementById('availableCount').textContent = available;
        document.getElementById('cleaningCount').textContent = cleaning;
        document.getElementById('checkedOutCount').textContent = checkedOut;
    }
    
    // Display rooms
    function displayRooms() {
        roomsGrid.innerHTML = rooms.map(room => {
            let statusClass = 'available';
            let statusText = 'Available';
            
            if (room.occupied) {
                statusClass = 'occupied';
                statusText = 'Occupied';
            } else if (room.needsCleaning) {
                statusClass = 'cleaning';
                statusText = 'Needs Cleaning';
            } else if (room.checkedOut) {
                statusClass = 'checked-out';
                statusText = 'Checked Out';
            }
            
            return `
                <div class="admin-room-card ${statusClass}">
                    <div class="room-header">
                        <div class="room-number">Room ${room.id}</div>
                        <div class="room-status status-${statusClass.replace('-', '')}">${statusText}</div>
                    </div>
                    <div class="room-type">${room.type} - $${room.price}/night</div>
                    <div class="room-controls">
                        <button class="control-btn ${room.occupied ? 'active' : ''}" 
                                onclick="updateRoomStatus(${room.id}, 'occupied', ${!room.occupied})">
                            ${room.occupied ? 'Mark Available' : 'Mark Occupied'}
                        </button>
                        <button class="control-btn ${room.needsCleaning ? 'active' : ''}" 
                                onclick="updateRoomStatus(${room.id}, 'needsCleaning', ${!room.needsCleaning})">
                            ${room.needsCleaning ? 'Cleaned' : 'Needs Cleaning'}
                        </button>
                        <button class="control-btn ${room.checkedOut ? 'active' : ''}" 
                                onclick="updateRoomStatus(${room.id}, 'checkedOut', ${!room.checkedOut})">
                            ${room.checkedOut ? 'Clear Checkout' : 'Mark Checked Out'}
                        </button>
                        <button class="control-btn" 
                                onclick="resetRoom(${room.id})">
                            Reset Room
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Display bookings
    function displayBookings() {
        if (bookings.length === 0) {
            bookingsTable.innerHTML = '<p>No bookings found.</p>';
            return;
        }
        
        // Sort bookings by date (newest first)
        const sortedBookings = bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        const recentBookings = sortedBookings.slice(0, 10); // Show last 10 bookings
        
        bookingsTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Guest Name</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Total Cost</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentBookings.map(booking => `
                        <tr>
                            <td>${booking.id.substring(0, 8)}...</td>
                            <td>${booking.guestName}</td>
                            <td>Room ${booking.roomId} (${booking.roomType})</td>
                            <td>${booking.checkIn}</td>
                            <td>${booking.checkOut}</td>
                            <td>$${booking.totalCost}</td>
                            <td><span class="status-${booking.status}">${booking.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
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
            } else {
                alert('Failed to update room status');
            }
        } catch (error) {
            console.error('Error updating room status:', error);
            alert('Failed to update room status');
        }
    };
    
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
