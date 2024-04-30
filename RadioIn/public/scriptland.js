const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    socket.emit('requestUsernames');

    socket.on('updateUsernames', usernames => {
        const containerA = document.getElementById('containerA');
        containerA.innerHTML = ''; // Clear previous usernames

        usernames.forEach(user => {
            const userBtn = document.createElement('button');
            userBtn.textContent = user.name;
            userBtn.className = 'username';
            userBtn.onclick = () => selectUsername(user.name, userBtn);

            if (user.available) {
                containerA.appendChild(userBtn);
            } else {
                userBtn.disabled = true;
            }
        });
    });
});

function selectUsername(name, btn) {
    const previouslyActive = document.querySelector('.username.active');
    if (previouslyActive) {
        previouslyActive.classList.remove('active');
    }
    btn.classList.add('active');
    sessionStorage.setItem('username', name);
    document.getElementById('enterButton').disabled = false;
}

function enterChat() {
    const username = sessionStorage.getItem('username');
    if (username) {
        window.location.href = 'chat.html';
    } else {
        alert('Please select a username.');
    }
}
