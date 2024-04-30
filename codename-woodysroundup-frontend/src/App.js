import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:3001/messages')
            .then(res => setMessages(res.data));
    }, []);

    const sendMessage = () => {
        axios.post('http://localhost:3001/messages', { text: message, userId: username })
            .then(res => {
                setMessages([...messages, res.data]);
                setMessage('');
            });
    };

    return (
        <div className="App">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
            <button onClick={sendMessage}>Send</button>
            <div>
                {messages.map(msg => (
                    <p key={msg.id}>{msg.text}</p>
                ))}
            </div>
        </div>
    );
}

export default App;
