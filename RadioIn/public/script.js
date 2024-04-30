const socket = io();
const table = document.getElementById('table');
const chatLog = document.getElementById('chatLog');
let timeoutID;

document.addEventListener('DOMContentLoaded', function() {
    const username = sessionStorage.getItem('username');
    if (username) {
        joinChat(username);
    } else {
        alert('No username selected. Redirecting to select a username.');
        window.location.href = 'land.html';
    }
});

function joinChat(username) {
    socket.emit('join', username);
}

socket.on('joined', (seatIndex, username) => {
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
    const chatLog = document.getElementById('chatLog');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${data.username}: ${data.message}`;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to the latest message
});

window.addEventListener("beforeunload", () => {
    socket.emit('chatExit');
    window.location.href = 'land.html';
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        timeoutID = setTimeout(() => {
            socket.emit('chatExit');
            window.location.href = 'land.html';
        }, 300000); // Wait for 5 minutes (300,000 milliseconds) before emitting disconnect event
    } else {
        clearTimeout(timeoutID); // Clear the timeout if tab becomes visible again
    }
});

socket.on('error', (errorMessage) => {
    alert(errorMessage);
});

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message.trim()) {  // Make sure not to send empty messages
        socket.emit('message', { username: sessionStorage.getItem('username'), message });
        messageInput.value = ''; // Clear input field after sending
    }
}

