require('dotenv').config(); // Load environment variables

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const crypto = require('crypto');

const allowedOrigins = ['http://your-allowed-origin.com', 'http://localhost:3000'];
const secretKey = process.env.SECRET_KEY;

const app = express();
const server = http.createServer(app);

// Middleware
app.use(morgan('combined')); // Log HTTP requests
app.use(helmet()); // Secure HTTP headers

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],  // Allow scripts from self and Cloudflare
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],  // Allow external styles and inline styles
            fontSrc: ["'self'", "https://fonts.gstatic.com"],  // Allow font sources from Google Fonts
            imgSrc: ["*"],  // Allow images from any source
        },
    },
}));


app.use(express.json());

// HTTPS Redirect Middleware
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
});

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

function encrypt(text, key) {
    const iv = crypto.randomBytes(12); // AES-GCM requires 12 bytes IV
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

app.post('/check-key', (req, res) => {
    const { parameter } = req.body;

    // Check if the parameter matches the secret key
    const keysMatch = parameter === secretKey;

    // Respond with true or false
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
