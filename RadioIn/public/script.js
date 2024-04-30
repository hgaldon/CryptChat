const socket = io();
const table = document.getElementById('roundTable');
const chatLog = document.getElementById('chatLog');
let timeoutID;

ddocument.addEventListener('DOMContentLoaded', function() {
    const username = sessionStorage.getItem('username');
    const table = document.getElementById('roundTable'); // Make sure to select the roundTable element
    socket.on('updateUsernames', (available, unavailable) => {
        updateSeats(available, unavailable);
    });
});

function updateSeats(available, unavailable) {
    // Clear the existing content of the seats
    for (let i = 1; i <= 8; i++) {
        const seat = document.getElementById(`seat${i}`);
        seat.innerText = 'Empty'; // Reset text to 'Empty'
    }

    unavailable.forEach((username, index) => {
        const seatID = `seat${index + 1}`; // ID starting from 1
        const seat = document.getElementById(seatID);
        if (seat) {
            seat.innerText = username; // Assign username to the seat
        }
    });
}

socket.on('message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${data.username}: ${data.message}`;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to the latest message
});

window.addEventListener("beforeunload", () => {
    socket.emit('chatExit');
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        timeoutID = setTimeout(() => {
            socket.emit('chatExit');
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
