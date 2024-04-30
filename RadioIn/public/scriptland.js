const socket = io();
const allUsernames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"];

document.addEventListener('DOMContentLoaded', function() {
    socket.emit('requestUsernames');

    socket.on('updateUsernames', usernamesStatus => {
        const containerA = document.getElementById('containerA');
        const containerB = document.getElementById('containerB');
        containerA.innerHTML = '<div>Available:</div>';
        containerB.innerHTML = '<div>Unavailable:</div>';

        allUsernames.forEach(username => {
            const userBtn = document.createElement('button');
            userBtn.textContent = username;
            const isAvailable = usernamesStatus.find(user => user.name === username && user.available);

            if (isAvailable) {
                userBtn.addEventListener('click', () => {
                    sessionStorage.setItem('username', username);
                    window.location.href = 'chat.html';
                });
                containerA.appendChild(userBtn);
            } else {
                userBtn.disabled = true;
                containerB.appendChild(userBtn);
            }
        });
    });
});

function enterChat() {
    const selectedUsername = document.querySelector('#containerA button:not([disabled])');
    if (selectedUsername) {
        sessionStorage.setItem('username', selectedUsername.textContent);
        window.location.href = 'chat.html';
    } else {
        alert('Please select a username.');
    }
}
