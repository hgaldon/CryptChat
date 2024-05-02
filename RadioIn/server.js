const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const sharedsession = require("express-socket.io-session");
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const sessionMiddleware = session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
});

app.use(sessionMiddleware);
app.use(bodyParser.json());
io.use(sharedsession(sessionMiddleware, { autoSave:true }));

app.use(express.static('public'));

const users = {};
const userSockets = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/land.html');
});

app.post('/keys', (req, res) => {
    const { username, publicKey } = req.body;
    users[username] = publicKey;
    console.log(users);  // Log the current state of `users`
    res.status(200).send({ message: 'Public key stored successfully' });
});

app.get('/keys', (req, res) => {
    const requester = req.query.username;
    const otherUsersKeys = Object.fromEntries(
        Object.entries(users).filter(([username]) => username !== requester)
    );
    res.status(200).json(otherUsersKeys);
});

function removeUser(username) {
    if (username in users) {
        delete users[username];
        console.log(`Removed ${username}. Remaining users:`, Object.keys(users));
        return { success: true, message: 'User removed successfully' };
    } else {
        console.log(`Failed to remove ${username}. User not found.`);
        return { success: false, message: 'User not found' };
    }
}


const PORT = 3000;
const availableSeats = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
const unavailableSeats = [];

const ENCRYPTION_KEY = crypto.randomBytes(32);
const IV_LENGTH = 16;

function encryptMessage(message) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptMessage(message) {
    let parts = message.split(':');
    let iv = Buffer.from(parts.shift(), 'hex');
    let encryptedText = Buffer.from(parts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

io.on('connection', (socket) => {
    // Send initial username statuses when a client connects
    socket.emit('updateUsernames', {
        available: availableSeats,
        unavailable: unavailableSeats
    });

    socket.on('update', () => {
        io.emit('updateUsernames', {
            available: availableSeats,
            unavailable: unavailableSeats
        });
    })

    socket.on('confirmUsername', (username) => {
        const index = availableSeats.indexOf(username);
        if (index !== -1) {
            // Move username from available to unavailable
            availableSeats.splice(index, 1);
            unavailableSeats.push(username);

            socket.handshake.session.username = username;
            socket.handshake.session.save();
            userSockets[username] = socket.id;
            console.log(`User ${username} connected with ID ${socket.id}`);

            // Immediately update all clients about the availability
            io.emit('updateUsernames', {
                available: availableSeats,
                unavailable: unavailableSeats
            });

            const joinMessage = {
                username: 'System',
                message: 'A user has joined the chat.'
            };
            io.emit('message', joinMessage);
        } else {
            socket.emit('error', 'Username already taken or invalid upon confirmation.');
        }
    });   

    socket.on('message', (data) => {
        if (!Array.isArray(data.messages)) {
            socket.emit('error', 'Invalid message format');
            return;
        }

        data.messages.forEach(message => {
            const recipient = message.user;
            const encryptedMessage = message.encryptedMessage;
            console.log(recipient);
            console.log(encryptedMessage);
            io.emit('message', { sender: data.username, username: recipient, message: encryptedMessage });
        });
    });

    socket.on('chatExit', () => {
        const username = socket.handshake.session.username;
        Object.keys(userSockets).forEach(username => {
            if (userSockets[username] === socket.id) {
                delete userSockets[username];
                console.log(`User ${username} disconnected`);
            }
        });
        removeUser(username);
        if (username) {
            const index = unavailableSeats.indexOf(username);
            if (index !== -1) {
                // Move username from unavailable to available
                unavailableSeats.splice(index, 1);
                availableSeats.push(username);

                // Immediately update all clients about the availability
                io.emit('updateUsernames', {
                    available: availableSeats,
                    unavailable: unavailableSeats
                });
            }
        }

        const leaveMessage = {
            username: 'System',
            message: 'A user has left the chat.'
        };
        io.emit('message', leaveMessage);
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
