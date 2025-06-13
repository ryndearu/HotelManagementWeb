const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'hotel-booking-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Data files
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(ROOMS_FILE)) {  const initialRooms = [
    {
      id: 1,
      type: 'Standard',
      price: 100,
      description: 'Kamar standard yang nyaman dengan fasilitas modern',
      image: '/images/standard-room.jpg',
      occupied: false,
      needsCleaning: false,
      checkedOut: false
    },
    {
      id: 2,
      type: 'Standard',
      price: 100,
      description: 'Kamar standard yang nyaman dengan fasilitas modern',
      image: '/images/standard-room.jpg',
      occupied: false,
      needsCleaning: false,
      checkedOut: false
    },
    {
      id: 3,
      type: 'Deluxe',
      price: 200,
      description: 'Kamar deluxe mewah dengan fasilitas premium dan pemandangan kota',
      image: '/images/deluxe-room.jpg',
      occupied: false,
      needsCleaning: false,
      checkedOut: false
    },
    {
      id: 4,
      type: 'Deluxe',
      price: 200,
      description: 'Kamar deluxe mewah dengan fasilitas premium dan pemandangan kota',
      image: '/images/deluxe-room.jpg',
      occupied: false,
      needsCleaning: false,
      checkedOut: false
    }
  ];
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(initialRooms, null, 2));
}

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'hotel123'
};

// Helper functions
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// API Routes
app.get('/api/rooms', (req, res) => {
  const rooms = readJSON(ROOMS_FILE);
  res.json(rooms);
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Kredensial tidak valid' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

app.get('/api/admin/rooms', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Tidak diizinkan' });
  }
  
  const rooms = readJSON(ROOMS_FILE);
  res.json(rooms);
});

app.put('/api/admin/rooms/:id', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Tidak diizinkan' });
  }
  
  const roomId = parseInt(req.params.id);
  const { occupied, needsCleaning, checkedOut } = req.body;
  
  const rooms = readJSON(ROOMS_FILE);
  const roomIndex = rooms.findIndex(room => room.id === roomId);
  
  if (roomIndex !== -1) {
    rooms[roomIndex] = { ...rooms[roomIndex], occupied, needsCleaning, checkedOut };
    writeJSON(ROOMS_FILE, rooms);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Kamar tidak ditemukan' });
  }
});

app.post('/api/booking', (req, res) => {
  const { roomId, checkIn, checkOut, guestName, guestEmail, guestPhone } = req.body;
  
  const bookings = readJSON(BOOKINGS_FILE);
  const rooms = readJSON(ROOMS_FILE);
  
  const room = rooms.find(r => r.id === parseInt(roomId));
  if (!room) {
    return res.status(400).json({ error: 'Kamar tidak ditemukan' });
  }
  
  // Calculate total cost
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const totalCost = nights * room.price;
  
  const booking = {
    id: uuidv4(),
    roomId: parseInt(roomId),
    roomType: room.type,
    checkIn,
    checkOut,
    nights,
    totalCost,
    guestName,
    guestEmail,
    guestPhone,
    bookingDate: new Date().toISOString(),
    status: 'confirmed'
  };
  
  bookings.push(booking);
  writeJSON(BOOKINGS_FILE, bookings);
  
  // Mark room as occupied
  const roomIndex = rooms.findIndex(r => r.id === parseInt(roomId));
  if (roomIndex !== -1) {
    rooms[roomIndex].occupied = true;
    writeJSON(ROOMS_FILE, rooms);
  }
  
  res.json({ success: true, booking });
});

app.get('/api/bookings', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Tidak diizinkan' });
  }
  
  const bookings = readJSON(BOOKINGS_FILE);
  res.json(bookings);
});

app.listen(PORT, () => {
  console.log(`Server booking hotel berjalan di http://localhost:${PORT}`);
});
