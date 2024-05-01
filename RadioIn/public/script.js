const socket = io();
const table = document.getElementById('roundTable');
const chatLog = document.getElementById('chatLog');
let timeoutID;
let username;

document.addEventListener('DOMContentLoaded', function() {
    fetchNews();
    setInterval(fetchNews, 5000);
    username = localStorage.getItem('username');
    sessionStorage.setItem('username', username);
    socket.emit('chatEntry');
    socket.on('updateUsernames', ({ available, unavailable }) => {
        updateSeats(available, unavailable);
    });
});


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
            seat.innerText = unavailable[i].charAt(0);; // Assign username to the seat
        }
    }
}


socket.on('message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${data.username}: ${data.message}`;
    // Assign classes based on the username or any other suitable logic
    messageDiv.className = 'message ' + (data.username === sessionStorage.getItem('username') ? 'sent-message' : 'received-message');
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to the latest message
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

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message.trim()) {  // Make sure not to send empty messages
        socket.emit('message', { username: localStorage.getItem('username'), message });
        messageInput.value = ''; // Clear input field after sending
    }
}

function leave() {
    localStorage.removeItem('username');
    sessionStorage.removeItem('username');
    socket.emit('chatExit');
    window.location.href = '/';
};

async function fetchNews() {
    const apiKey = '471658b22276428ab17487cd7d28aaf2'; // Replace with your actual API key
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