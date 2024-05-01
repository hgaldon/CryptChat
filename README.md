# Radio-In
Radio-In


Introduction:


The Encrypted Chatroom App is a web application designed for secure communication among users. It features an interactive and event-driven front end, a back end that serves resources with a RESTful CRUD API, integration with a third-party API for real-time news updates, session-persistent state management, WebSocket for live updates, and a pleasing user experience.


Features:


Interactive and Event-Driven Front End:
Users can easily navigate through the application.
The front end provides interactive features for seamless communication.


land.html -
This file serves to hold and display the initial webpage. It visually will show what usernames are available and which ones are already in use by other users. It includes styling from stylesland.css and a script from scriptland.js


stylesland.css -
The styling file holds all aspects of styling and format for the initial page.


chat.html - This file serves to hold and display the chatroom webpage. It visually will show what users are currently chatting, a collective chatlog, input bar and send button, and a list of news articles.It includes styling from styles.css and a script from script.js


styles.css - The styling file holds all aspects of styling and format for the chatroom page.


scriptland.js -
The script file for the initial page contains code responsible for loading the correct usernames in the right locations. The file has several helper functions to aid in loading the page properly.
    createUserButton(name, available)- Creates buttons with usernames and places them in either available or unavailable columns, handles the 'click' action of the button when selected.
    selectUsername(name, btn) - Handles the selection of username and enablement of the Enter button.
    enterChat() - Socket confrims username and sends user to chat.html or alerts to select a username.


script.js -
The script file for the chatroom page contains code responsible for loading the correct usernames in the right locations, the chatlog, and news articles from a 3rd party API. The file has several helper functions to aid in loading the page properly.
    updateSeats(available, unavailable) - Clear the existing content of the seats.  Fill the seats with usernames from the 'unavailable' array.
    sendMessage() - Make sure the chat input is not empty then emit the message and clear the chat input.
    socket.on('message', (data) => {}) - Listens for a message to enter the chat log. Assigns classes based on the username or any other suitable logic. Auto-scrolls to the latest message in the chatlog.
    socket.on('error', (errorMessage) => {}) - Send an alert if socket detects an error.
    document.addEventListener("visibilitychange", () => {}) - Hide the document if a user timesout for 5 minutes. Make the document visible again if they return.
    window.addEventListener("beforeunload", () => {}) - Chat exit.








Back End with RESTful API:
The back end serves resources with a RESTful CRUD API.
It manages user sessions and stores chat logs.
Users can create, read, update, and delete messages in the chat log.


server.js - This file serves as the backend to authenticate users, encrypt data, and communicate with storage. Several helper functions aid in the files success.


    encryptMessage(message) - Using the crypto module, encrypt the messages with AES-256.
    decryptMessage(message) - Using the crypto module, decrypt encrypted messages with AES-256.
    io.on('connection', (socket) => {}) - Send initial username statuses when a client connects.
   












WebSocket for Live Updates:
Utilizes WebSocket for real-time updates in the chatroom, providing instant message delivery and synchronization.


server.js - This file serves as the backend to authenticate users, encrypt data, and communicate with storage. Several helper functions aid in the files success.


    socket.on('confirmUsername', (username) => {}) - Confirm correct username can be selected. If not emit an error. Move username from available to unavailable. Immediately update all clients about the availability.
    socket.on('message', (data) => {}) - Ensure the message is a string. Encrypt then decrypt message before emitting.
    socket.on('chatExit', () => {}) - Move username from unavailable to available. Immediately update all clients about the availability
    socket.on('chatEntry', () => {}) - Update usernames. Emit a welcome message.






Third-Party API Integration:
Integrates with the News API from newsapi.org for real-time news updates in the chatroom.


script.js


    fetchNews() - Using a API key obtained from newsapi.org, fetch the articles.
    displayNews(articles) - Display the fetched articles from the JSON data.
    startNewsScroll() - Set an interval so that the articles are scrolled through automatically.






Session-Persistent State:
Session persistence tracks usernames, associated users, and chat logs.
User-specific preferences and data are stored to maintain interactions.




Pleasing User Experience:
Provide a sleek and user-friendly layout for effective communication.
Style the real-time news updates to enhance user engagement and experience.




Technologies Used:

Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Third-Party API: News API from newsapi.org
Session Management: sessionStorage
WebSocket: Socket.io for live updates
Encryption: Implement encryption algorithms for secure messaging


Installation and Usage:

Clone the repository from GitHub.
Navigate to the project directory and install dependencies using npm install.
Start the server by running npm start in the backend directory.
Open the app in a web browser to begin using the chatroom.


Contributors:
Harry Galdon
Tyler Nguyen
Keith Lystad
Fisher Ramsey