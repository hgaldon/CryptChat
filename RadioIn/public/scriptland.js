const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    socket.on('updateUsernames', ({ available, unavailable }) => {
        const containerA = document.getElementById('containerA');
        const containerB = document.getElementById('containerB');
        containerA.innerHTML = '';
        containerB.innerHTML = '';

        available.forEach(user => {
            const userBtn = createUserButton(user, true);
            containerA.appendChild(userBtn);
        });

        unavailable.forEach(user => {
            const userBtn = createUserButton(user, false);
            containerB.appendChild(userBtn);
        });

        const username = localStorage.getItem('username');
        if (username !== 'null' && username) {
            console.log("Yes");
            enterChat();
        } else {
            console.log("Nope");
        }
    });
});

function createUserButton(name, available) {
    const userBtn = document.createElement('button');
    userBtn.textContent = name;
    userBtn.className = 'username';
    userBtn.disabled = !available;
    userBtn.onclick = () => {
        if (available) selectUsername(name, userBtn);
    };
    return userBtn;
}

function selectUsername(name, btn) {
    const previouslyActive = document.querySelector('.username.active');
    if (previouslyActive) {
        previouslyActive.classList.remove('active');
        previouslyActive.disabled = false;
        document.getElementById('containerA').appendChild(previouslyActive);
    }
    btn.classList.add('active');
    localStorage.setItem('username', name);
    document.getElementById('enterButton').disabled = false;
}

function enterChat() {
    const username = localStorage.getItem('username');
    if (username) {
        socket.emit('confirmUsername', username); // Confirm username selection
        window.location.href = 'chat.html';
    } else {
        alert('Please select a username.');
    }
}