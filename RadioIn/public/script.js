const socket = io();
const table = document.getElementById('table');
const chatLog = document.getElementById('chatLog');
const newsFeed = document.getElementById('newsFeed');

document.addEventListener('DOMContentLoaded', function() {
    const username = sessionStorage.getItem('username');
    if (username) {
        joinChat(username);
    }
});

function joinChat(username) {
    socket.emit('join', username);
}

socket.on('joined', (seatIndex, username) => {
    document.getElementById('usernameInput').value = username;
    console.log(`You've joined as ${username} at seat ${seatIndex}`);
});

socket.on('updateSeats', (seats) => {
    table.innerHTML = '';
    seats.forEach((seat, index) => {
        const seatDiv = document.createElement('div');
        seatDiv.className = 'seat';
        seatDiv.innerText = seat || 'Empty';
        seatDiv.style.transform = `rotate(${index * 45}deg) translate(200px) rotate(-${index * 45}deg)`;
        table.appendChild(seatDiv);
    });
});

socket.on('message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${data.username}: ${data.message}`;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
});

socket.on('error', (errorMessage) => {
    alert(errorMessage);
});

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    socket.emit('message', message);
    document.getElementById('messageInput').value = ''; // Clear input field after sending
}

// Assuming news fetching function exists or similar to previous explanations
