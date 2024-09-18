require('dotenv').config(); // Load environment variables

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(morgan('combined')); // Log HTTP requests
app.use(helmet()); // Secure HTTP headers


const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts if necessary
            imgSrc: ["*"], // Allow external image sources
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if necessary
        },
    },
}));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
});

// WebSocket handling
wss.on('connection', ws => {
    ws.on('message', message => {
        try {
            const data = JSON.parse(message);  // Parse the JSON string

            // Broadcast the message to all clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));  // Broadcast array as JSON
                }
            });
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
