const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const sharedsession = require("express-socket.io-session");
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Session middleware
const sessionMiddleware = session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Note: secure should be true in production with HTTPS
});

app.use(sessionMiddleware);
io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const seats = Array(8).fill(null);
const militaryAlphabet = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

// Encryption key
const ENCRYPTION_KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'; // Replace with your key in hex format
const IV_LENGTH = 16;

function encryptMessage(message) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptMessage(message) {
    let textParts = message.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

io.on('connection', (socket) => {
    if (socket.handshake.session.username) {
        const username = socket.handshake.session.username;
        const seatIndex = seats.findIndex(seat => seat === username);
        if (seatIndex !== -1) {
            socket.emit('rejoin', seatIndex, username);
            io.emit('updateSeats', seats);
        }
    }

    socket.on('join', (username) => {
        if (!militaryAlphabet.includes(username) || seats.includes(username)) {
            socket.emit('error', 'Username taken or invalid');
            return;
        }
        const seatIndex = seats.findIndex(seat => seat === null);
        if (seatIndex !== -1) {
            seats[seatIndex] = username;
            socket.handshake.session.username = username;
            socket.handshake.session.save();
            socket.emit('joined', seatIndex, username);
            io.emit('updateSeats', seats);
        } else {
            socket.emit('error', 'No available seats');
        }
    });

    socket.on('message', (message) => {
        const encryptedMessage = encryptMessage(message);
        const decryptedMessage = decryptMessage(encryptedMessage);  // Decrypt before sending to client
        io.emit('message', { username: socket.handshake.session.username, message: decryptedMessage });
    });

    socket.on('disconnect', () => {
        const index = seats.indexOf(socket.handshake.session.username);
        if (index !== -1) {
            seats[index] = null;
            io.emit('updateSeats', seats);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
