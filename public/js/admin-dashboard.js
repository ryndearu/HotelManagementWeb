document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const roomsGrid = document.getElementById('roomsGrid');
    const bookingsTable = document.getElementById('bookingsTable');
    
    let rooms = [];
    let bookings = [];
    let connectionTimeout = null;
    
    // Show loading/connection status
    function showStatus(message, type = 'info') {
        // Create status element if it doesn't exist
        let statusElement = document.getElementById('statusMessage');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'statusMessage';
            statusElement.style.cssText = `
                position: fixed; top: 70px; right: 20px; 
                padding: 10px 15px; border-radius: 5px; 
                font-weight: bold; z-index: 1000; 
                max-width: 300px; word-wrap: break-word;
            `;
            document.body.appendChild(statusElement);
        }
        
        // Set style based on type
        const styles = {
            info: 'background: #007bff; color: white;',
            success: 'background: #28a745; color: white;',
            warning: 'background: #ffc107; color: black;',
            error: 'background: #dc3545; color: white;'
        };
        
        statusElement.style.cssText += styles[type] || styles.info;
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        // Auto hide after 3 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (statusElement) statusElement.style.display = 'none';
            }, 3000);
        }
    }

    // Logout functionality
    logoutBtn.addEventListener('click', async function() {
        try {
            await fetch('/api/admin/logout', { 
                method: 'POST',
                credentials: 'same-origin'
            });
            window.location.href = '/admin';
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, redirect to login
            window.location.href = '/admin';
        }
    });
    
    // Refresh data
    refreshBtn.addEventListener('click', function() {
        loadDashboardData();
    });
    
    // Check session status before making requests
    async function checkSession() {
        try {
            const response = await fetch('/api/admin/check-session', {
                credentials: 'same-origin'
            });
            const result = await response.json();
            if (!result.isLoggedIn) {
                window.location.href = '/admin';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking session:', error);
            window.location.href = '/admin';
            return false;
        }
    }

    // Load dashboard data
    async function loadDashboardData() {
        showStatus('Loading dashboard data...', 'info');
        
        // Check session first
        const sessionValid = await checkSession();
        if (!sessionValid) return;

        try {
            // Load rooms
            const roomsResponse = await fetch('/api/admin/rooms', {
                credentials: 'same-origin'
            });
            if (roomsResponse.status === 401) {
                showStatus('Session expired. Redirecting to login...', 'error');
                setTimeout(() => window.location.href = '/admin', 2000);
                return;
            }
            if (roomsResponse.ok) {
                rooms = await roomsResponse.json();
                displayRooms();
                updateStats();
            } else {
                showStatus('Failed to load rooms data', 'error');
                console.error('Failed to load rooms');
            }
            
            // Load bookings
            const bookingsResponse = await fetch('/api/bookings', {
                credentials: 'same-origin'
            });
            if (bookingsResponse.status === 401) {
                showStatus('Session expired. Redirecting to login...', 'error');
                setTimeout(() => window.location.href = '/admin', 2000);
                return;
            }
            if (bookingsResponse.ok) {
                bookings = await bookingsResponse.json();
                displayBookings();
                showStatus('Dashboard loaded successfully', 'success');
            } else {
                showStatus('Failed to load bookings data', 'warning');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showStatus('Network error. Please check your connection.', 'error');
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
            showStatus('Updating room status...', 'info');
            
            // Check session before making update
            const sessionValid = await checkSession();
            if (!sessionValid) return;

            const room = rooms.find(r => r.id === roomId);
            const updatedRoom = { ...room };
            updatedRoom[statusType] = value;
            
            const response = await fetch(`/api/admin/rooms/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedRoom),
                credentials: 'same-origin' // Include session cookies
            });
            
            if (response.status === 401) {
                showStatus('Session expired. Redirecting to login...', 'error');
                setTimeout(() => window.location.href = '/admin', 2000);
                return;
            }
            
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
                
                showStatus('Room status updated successfully', 'success');
            } else {
                const errorData = await response.json();
                showStatus(`Failed to update: ${errorData.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error updating room status:', error);
            showStatus('Network error. Please check your connection.', 'error');
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
                // Check session before making update
                const sessionValid = await checkSession();
                if (!sessionValid) return;

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
                    body: JSON.stringify(updatedRoom),
                    credentials: 'same-origin' // Include session cookies
                });
                
                if (response.status === 401) {
                    alert('Session expired. Please login again.');
                    window.location.href = '/admin';
                    return;
                }
                
                if (response.ok) {
                    // Update local data
                    const roomIndex = rooms.findIndex(r => r.id === roomId);
                    rooms[roomIndex] = updatedRoom;
                    displayRooms();
                    updateStats();
                    
                    // Update checkout status in bookings table
                    updateCheckoutStatusInTable(roomId, false);
                } else {
                    const errorData = await response.json();
                    alert(`Failed to reset room: ${errorData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error resetting room:', error);
                alert('Network error. Please check your connection and try again.');
            }
        }
    };
    
    // Load initial data
    loadDashboardData();
    
    // Periodic session check (every 5 minutes)
    setInterval(async () => {
        const sessionValid = await checkSession();
        if (!sessionValid) {
            alert('Session expired. You will be redirected to login.');
        }
    }, 5 * 60 * 1000); // 5 minutes
});
