const socket = io();
const table = document.getElementById('table');
const chatLog = document.getElementById('chatLog');

document.addEventListener('DOMContentLoaded', function() {
    // Handle rejoining using session data
    socket.on('rejoin', (seatIndex, username) => {
        document.getElementById('usernameInput').value = username;
        document.getElementById('usernameInput').style.display = 'none';
        document.getElementById('joinButton').style.display = 'none';
        console.log(`You've rejoined as ${username} at seat ${seatIndex}`);
    });

    // Handle a new join
    socket.on('joined', (seatIndex, username) => {
        document.getElementById('usernameInput').style.display = 'none';
        document.getElementById('joinButton').style.display = 'none';
        console.log(`You've joined as ${username} at seat ${seatIndex}`);
    });

    // Update UI when seats are updated
    socket.on('updateSeats', (seats) => {
        table.innerHTML = ''; // Clear the table first
        seats.forEach((seat, index) => {
            const seatDiv = document.createElement('div');
            seatDiv.className = 'seat';
            seatDiv.innerText = seat || 'Empty';
            seatDiv.style.transform = `rotate(${index * 45}deg) translate(200px) rotate(-${index * 45}deg)`;
            table.appendChild(seatDiv);
        });
    });

    // Handle new messages
    socket.on('message', (data) => {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${data.username}: ${data.message}`;
        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to the newest message
    });

    // Handle errors (e.g., username taken or invalid)
    socket.on('error', (errorMessage) => {
        alert(errorMessage);
    });
});

function joinChat() {
    const username = document.getElementById('usernameInput').value;
    socket.emit('join', username);
}

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    socket.emit('message', message);
    document.getElementById('messageInput').value = ''; // Clear input field after sending
}
