require('dotenv').config(); // Load environment variables

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const fs = require('fs'); // for logging into a file
const cors = require('cors');

const allowedOrigins = [
    'http://localhost:3000',
];
const secretKey = process.env.SECRET_KEY;
const app = express();
app.use(cors());
const server = http.createServer(app);

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many attempts, please try again later.' }
});

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src http: ws: data:; style-src http: 'unsafe-inline'; script-src http: 'unsafe-inline' 'unsafe-eval' data:; connect-src http: ws:; img-src http: data:;");
    next();
});


app.use((req, res, next) => {
    console.log(`${req.method} request for '${req.url}' from ${req.ip}`);
    next();
});

app.use(express.json());

// serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// serve the HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
    console.log('Served index1.html');
});

const wss = new WebSocket.Server({
    server: server, // Attach WebSocket server to the HTTP server
    verifyClient: (info, callback) => {
        
        const origin = info.origin;
        console.log(`WebSocket connection attempt from origin: ${origin}`);
        
        // Allow connections from defined origins or any .onion addresses
        if (allowedOrigins.includes(origin) || origin.endsWith('.onion')) {
            callback(true); // Accept the connection
            console.log('WebSocket connection accepted');
        } else {
            callback(false, 401, 'Unauthorized'); // Reject the connection
            console.log('WebSocket connection rejected: Unauthorized origin');
        }
    }
});


function logInvalidAttempt(ip, origin, parameter) {
    const logMessage = `${new Date().toISOString()} - Invalid attempt from IP: ${ip}, Origin: ${origin}, Key: ${parameter}\n`;
    
    // Write the log to a file (appends to the file if it exists)
    fs.appendFile('invalid_attempts.log', logMessage, (err) => {
        if (err) console.error('Error logging invalid attempt:', err);
    });
}

function encrypt(text, key) {
    const iv = crypto.randomBytes(12); // AES-GCM requires 12 bytes IV
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

app.post('/check-key', limiter, (req, res) => {
    const origin = req.get('origin');
    const ip = req.ip || req.connection.remoteAddress;
    const { parameter } = req.body;

    if (!allowedOrigins.includes(origin)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the session key matches
    const keysMatch = parameter === secretKey;

    if (!keysMatch) {
        logInvalidAttempt(ip, origin, parameter); // Log the invalid attempt
    }

    return res.status(200).json({ match: keysMatch });
});


// webSocket handling
wss.on('connection', ws => {
    console.log('WebSocket connection established');
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

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
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


