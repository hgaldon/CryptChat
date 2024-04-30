const socket = io();
const table = document.getElementById('table');
const chatLog = document.getElementById('chatLog');

function joinChat() {
    const username = document.getElementById('usernameInput').value;
    socket.emit('join', username);
}

socket.on('joined', (seatIndex) => {
    alert(`You've joined at seat ${seatIndex}`);
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

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    socket.emit('message', message);
    document.getElementById('messageInput').value = ''; // Clear input field after sending
}

socket.on('message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${data.username}: ${data.message}`;
    chatLog.appendChild(messageDiv);
});

socket.on('error', (errorMessage) => {
    alert(errorMessage);
});
