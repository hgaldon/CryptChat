const socket = io();
const table = document.getElementById('roundTable');
const chatLog = document.getElementById('chatLog');
let timeoutID;
let username;


document.addEventListener('DOMContentLoaded', function() {
    const storedMessages = sessionStorage.getItem('chatMessages');
    if (storedMessages) {
        JSON.parse(storedMessages).forEach(data => {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = `${data.username}: ${data.message}`;
            messageDiv.className = 'message ' + (data.username === sessionStorage.getItem('username') ? 'sent-message' : 'received-message');
            chatLog.appendChild(messageDiv);
        });
        chatLog.scrollTop = chatLog.scrollHeight;
    }
    fetchNews();
    setInterval(fetchNews, 5000);
    priv = localStorage.getItem('privateKey');
    pub = localStorage.getItem('publicKey');
    username = localStorage.getItem('username');
    sessionStorage.setItem('username', username);
    if (!priv && !pub) {
        generateAndStoreKeyPair(username);
    }
    document.getElementById('sendButton').disabled = false;
    socket.on('updateUsernames', ({ available, unavailable }) => {
        updateSeats(available, unavailable);
        getAndStorePublicKeys()
    });
});

async function generateAndStoreKeyPair(name) {
    const button = document.getElementById('sendButton');
    button.innerText = 'Generating keys...'
    try {
        const keyPair = await window.crypto.subtle.generateKey({
            name: "RSA-OAEP",
            modulusLength: 2048,         
            publicExponent: new Uint8Array([1, 0, 1]),  
            hash: {name: "SHA-256"},     
        },
        true,                           
        ["encrypt", "decrypt"]         
        );

        const publicKeyData = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        localStorage.setItem('publicKey', arrayBufferToBase64(publicKeyData));
        localStorage.setItem('privateKey', arrayBufferToBase64(privateKeyData));
        sendPublicKeyToBackend(name, localStorage.getItem('publicKey'));
        button.innerText = 'Send'
    } catch (err) {
        console.error(err);
    }
}

async function sendPublicKeyToBackend(username, publicKey) {
    try {
        const response = await fetch('/keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, publicKey })
        });

        if (!response.ok) {
            throw new Error('Failed to send public key to backend');
        }

        console.log('Public key sent successfully');
    } catch (err) {
        console.error('Error sending public key to backend:', err);
    }
    socket.emit('update');
    getAndStorePublicKeys()
}


// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return window.btoa(binary);
}

async function getAndStorePublicKeys() {
    const response = await fetch(`/keys?username=${username}`);
    const keys = await response.json();
    localStorage.setItem('publicKeys', JSON.stringify(keys));
}

function updateSeats(available, unavailable) {
    // Clear the existing content of the seats
    for (let i = 1; i <= 8; i++) {
        const seat = document.getElementById(`seat${i}`);
        seat.innerText = ''; // Reset text to 'Empty'
    }

    // Fill the seats with usernames from the 'unavailable' array
    for (let i = 0; i < unavailable.length; i++) {
        const seatID = `seat${i + 1}`; // Create seat ID starting from seat1
        const seat = document.getElementById(seatID);
        if (seat) {
            seat.innerText = unavailable[i].charAt(0); // Assign username to the seat
        }
    }
}

// Function to import a public key for encryption
async function importPublicKey(publicKeyBase64) {
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)).buffer;
    return await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        { name: "RSA-OAEP", hash: {name: "SHA-256"} },
        true,
        ["encrypt"]
    );
}

// Function to import a private key for decryption
async function importPrivateKey(privateKeyBase64) {
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0)).buffer;
    return await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "RSA-OAEP", hash: {name: "SHA-256"} },
        true,
        ["decrypt"]
    );
}

async function decryptMessage(encryptedMessage, privateKey) {
    const encryptedBuffer = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBuffer
    );
    return new TextDecoder().decode(decryptedBuffer);
}

// Setup WebSocket or similar connection handling to receive messages
socket.on('message', async (data) => {
    const currentUsername = localStorage.getItem('username');
    if (data.username !== currentUsername) {
        console.log(`Message not for ${currentUsername}: message for ${data.username}`);
        return;  // Skip processing if the message is not for the current user
    }

    const privateKey = await importPrivateKey(localStorage.getItem('privateKey'));
    const decryptedMessage = await decryptMessage(data.message, privateKey);

    if (decryptedMessage) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${data.sender}: ${decryptedMessage}`;
        messageDiv.className = 'message ' + (data.sender === sessionStorage.getItem('username') ? 'sent-message' : 'received-message');
        const chatLog = document.getElementById('chatLog');
        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight;

        // Save messages to session storage
        let messages = sessionStorage.getItem('chatMessages');
        messages = messages ? JSON.parse(messages) : [];
        messages.push({ username: data.username, message: decryptedMessage });
        sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    } else {
        console.log('Failed to decrypt message or message was null.');
    }
});


window.addEventListener("beforeunload", (event) => {
    const storedData = sessionStorage.getItem('username');
    if (!storedData) {
        socket.emit('chatExit');
    }
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        timeoutID = setTimeout(() => {
            localStorage.removeItem('username');
            sessionStorage.removeItem('username');
            localStorage.removeItem('publicKey');
            localStorage.removeItem('privateKey');
            localStorage.removeItem('publicKeys');
            sessionStorage.removeItem('chatMessages');
            socket.emit('chatExit');
            window.location.href = '/';
        }, 300000); // Wait for 5 minutes (300,000 milliseconds) before emitting disconnect event
    } else {
        clearTimeout(timeoutID);
    }
});

socket.on('error', (errorMessage) => {
    alert(errorMessage);
});

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    const username = localStorage.getItem('username');

    if (message.trim()) {
        const publicKeys = JSON.parse(localStorage.getItem('publicKeys'));

        // Prepare an array to store promises for encryption operations
        let encryptedMessagesPromises = [];

        // Append sender's own message to the chat log directly
        appendMessageToChat(username, message);

        for (const [user, publicKeyBase64] of Object.entries(publicKeys)) {
            // Skip encrypting for the sender's own public key
            if (user !== username) {
                try {
                    const publicKey = await importPublicKey(publicKeyBase64);
                    const encryptedMessagePromise = window.crypto.subtle.encrypt(
                        { name: "RSA-OAEP" },
                        publicKey,
                        new TextEncoder().encode(message)
                    ).then(encrypted => {
                        const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
                        return { user: user, encryptedMessage: encryptedBase64 };
                    });

                    encryptedMessagesPromises.push(encryptedMessagePromise);
                } catch (err) {
                    console.error(`Encryption failed for ${user}:`, err);
                }
            }
        }

        // Wait for all encryption operations to complete
        Promise.all(encryptedMessagesPromises).then(encryptedMessages => {
            socket.emit('message', { username, messages: encryptedMessages });
            messageInput.value = ''; // Clear input field after sending
        }).catch(err => {
            console.error('Final encryption assembly failed:', err);
        });
    }
}

function appendMessageToChat(username, message) {
    const chatLog = document.getElementById('chatLog');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${username}: ${message}`;
    messageDiv.className = 'message sent-message';
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Save messages to session storage
    let messages = sessionStorage.getItem('chatMessages');
    messages = messages ? JSON.parse(messages) : [];
    messages.push({ username: username, message: message });
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
}

async function importPublicKey(publicKeyBase64) {
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)).buffer;
    return await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        { name: "RSA-OAEP", hash: {name: "SHA-256"} },
        false,
        ["encrypt"]
    );
}


function leave() {
    localStorage.removeItem('username');
    sessionStorage.removeItem('username');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('privateKey');
    localStorage.removeItem('publicKeys');
    sessionStorage.removeItem('chatMessages');
    socket.emit('chatExit');
    window.location.href = '/';
};

async function fetchNews() {
    const apiKey = '471658b22276428ab17487cd7d28aaf2';
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        displayNews(data.articles);
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

function displayNews(articles) {
    const newsContainer = document.getElementById('newsFeed');
    newsContainer.innerHTML = ''; // Clear existing news items

    articles.forEach(article => {
        const newsItem = document.createElement('div');
        const link = document.createElement('a');  // Create an anchor element
        const title = document.createElement('h2'); // Use a heading for the title
        const description = document.createElement('p'); // Use paragraph for the description

        title.textContent = article.title;
        description.textContent = article.description || "No description available."; // Provide a fallback

        link.href = article.url; // Set the URL from the article data
        link.target = "_blank"; // Opens the link in a new tab
        link.className = 'news-item-link'; // Optional: Assign a class for styling
        link.appendChild(title); // Append the title to the link

        title.className = 'news-item-title';
        description.className = 'news-item-description';

        newsItem.appendChild(link); // Append the link to the news item
        newsItem.appendChild(description);
        newsItem.className = 'news-item';

        newsContainer.appendChild(newsItem);
    });
}

function startNewsScroll() {
    const newsContainer = document.getElementById('newsFeed');
    setInterval(() => {
        if (newsContainer.scrollTop < newsContainer.scrollHeight - newsContainer.clientHeight) {
            newsContainer.scrollTop += 1;
        } else {
            newsContainer.scrollTop = 0;
        }
    }, 50);
}