const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Encryption key - ensure this is 32 bytes (256 bits)
const ENCRYPTION_KEY = '01234567890123456789012345678901';  // This key is exactly 32 bytes long
const IV_LENGTH = 16;  // AES block size in bytes for CBC mode

app.use(cors({
    origin: ['http://localhost:3000'],  // Adjust if your frontend is on a different port
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true in production when using HTTPS
}));

let messages = [];  // Store for messages

app.get('/messages', (req, res) => {
    const decryptedMessages = messages.map(message => ({
        ...message,
        text: decrypt(message.text)
    }));
    res.json(decryptedMessages);
});

app.post('/messages', (req, res) => {
    const { text, userId } = req.body;
    const encryptedText = encrypt(text);
    const message = { id: messages.length + 1, text: encryptedText, userId };
    messages.push(message);
    io.emit('newMessage', { ...message, text: text }); // Emit decrypted text for simplicity
    res.status(201).send(message);
});

// WebSocket setup for real-time communication
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('sendMessage', (message) => {
        const encryptedMessage = encrypt(message.text);
        const msg = { id: messages.length + 1, text: encryptedMessage, userId: message.userId };
        messages.push(msg);
        io.emit('newMessage', { ...msg, text: message.text }); // Send decrypted text
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    let parts = text.split(':');
    let iv = Buffer.from(parts.shift(), 'hex');
    let encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
