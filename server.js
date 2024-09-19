require('dotenv').config(); // Load environment variables

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const secretKey = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

// Middleware
app.use(morgan('combined')); // Log HTTP requests
app.use(helmet()); // Secure HTTP headers

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],  // Allow inline scripts if necessary
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],  // Allow external styles and inline styles
            fontSrc: ["'self'", "https://fonts.gstatic.com"],  // Allow font sources from Google Fonts
            imgSrc: ["*"],  // Allow images from any source
        },
    },
}));

// serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// serve the HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
});

function encrypt(text, key) {
    const iv = crypto.randomBytes(12); // AES-GCM requires 12 bytes IV
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

// webSocket handling
wss.on('connection', ws => {
    ws.on('message', message => {
        try {
            const data = JSON.parse(message); // Debugging 

            const encryptedMessage = encrypt(JSON.stringify(data), secretKey);

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(encryptedMessage); // No need to wrap in JSON.stringify
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
