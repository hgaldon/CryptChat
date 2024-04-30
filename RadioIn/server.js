const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const seats = Array(8).fill(null);
const militaryAlphabet = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

function encryptMessage(message) {
    const cipher = crypto.createCipher('aes-256-cbc', 'your-encryption-key');
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join', (username) => {
        if (!militaryAlphabet.includes(username) || seats.includes(username)) {
            socket.emit('error', 'Username taken or invalid');
            return;
        }
        const seatIndex = seats.findIndex(seat => seat === null);
        if (seatIndex !== -1) {
            seats[seatIndex] = username;
            socket.username = username;
            socket.emit('joined', seatIndex);
            io.emit('updateSeats', seats);
        } else {
            socket.emit('error', 'No available seats');
        }
    });

    socket.on('message', (message) => {
        const encryptedMessage = encryptMessage(message);
        io.emit('message', { username: socket.username, message: encryptedMessage });
    });

    socket.on('disconnect', () => {
        const index = seats.indexOf(socket.username);
        if (index !== -1) {
            seats[index] = null;
            io.emit('updateSeats', seats);
        }
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
