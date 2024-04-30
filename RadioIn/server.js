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

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the entry page at the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/land.html');  // Ensure the landing page is named correctly
});

const PORT = process.env.PORT || 3000;
const seats = Array(8).fill(null);
const militaryAlphabet = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

// Encryption key
const ENCRYPTION_KEY = crypto.randomBytes(32); // Generates a 32-byte key for AES-256
const IV_LENGTH = 16; // For AES, this is always 16

function encryptMessage(message) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(message);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptMessage(message) {
    let textParts = message.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

io.on('connection', (socket) => {
    socket.on('requestUsernames', () => {
        const usernames = militaryAlphabet.map(name => ({
            name,
            available: !seats.includes(name)
        }));
        socket.emit('updateUsernames', usernames);
    });

    socket.on('selectUsername', username => {
        if (!militaryAlphabet.includes(username) || seats.includes(username)) {
            socket.emit('error', 'Username taken or invalid');
            return;
        }
        const seatIndex = seats.findIndex(seat => seat === null);
        if (seatIndex !== -1) {
            seats[seatIndex] = username;
            socket.handshake.session.username = username;
            socket.handshake.session.save();
            socket.broadcast.emit('usernameSelected', { username, index: seatIndex });
            io.emit('updateSeats', seats);
        }
    });

    socket.on('message', (message) => {
        const encryptedMessage = encryptMessage(message);
        const decryptedMessage = decryptMessage(encryptedMessage);
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
