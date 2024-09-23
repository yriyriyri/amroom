require('dotenv').config(); // Load environment variables

const express = require('express');
//const http = require('http');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const fs = require('fs'); // for logging into a file

const allowedOrigins = [
    'http://6bgeke4fcy4hbuo7tpn74pblhaxeqfyqkyqa3ddw6vwdv3ouocz7vwid.onion',
    'http://localhost:3000',

];
const secretKey = process.env.SECRET_KEY;

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many attempts, please try again later.' }
});

// middleware
app.use(morgan('combined')); // log HTTP requests
//app.use(helmet()); // secure HTTP headers

app.use(helmet({
    hsts: false, //for testting 
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "data:"],
            scriptSrc: ["'self'", "public/libs/purify.min.js"],
            styleSrc: ["'self'", "'unsafe-inline'", "http://fonts.gstatic.com", "http://fonts.googleapis.com"],
            fontSrc: ["'self'", "http://fonts.gstatic.com"],
            imgSrc: ["*"]
        },
    },
    referrerPolicy: { policy: "no-referrer" },
}));

app.use(express.json());

// serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// serve the HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
});


const wss = new WebSocket.Server({ 
    server,
    verifyClient: (info, callback) => {
        const origin = info.origin;
        if (allowedOrigins.includes(origin)) {
            callback(true); // Accept the connection
        } else {
            callback(false, 401, 'Unauthorized'); // Reject the connection
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


