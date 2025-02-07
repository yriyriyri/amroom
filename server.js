require('dotenv').config(); 

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const fs = require('fs'); 
const cors = require('cors');

// cors Checks 

const allowedOrigins = [
    'http://localhost:3000',
    'http://6bgeke4fcy4hbuo7tpn74pblhaxeqfyqkyqa3ddw6vwdv3ouocz7vwid.onion',
    'http://127.0.0.1:5500',
];
const secretKey = process.env.SECRET_KEY;
const app = express();
app.use(cors());
const server = http.createServer(app);

//rate limit

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 5, 
    message: { error: 'Too many attempts, please try again later.' }
});

//csp UNFINISHED

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src http: ws: data:; style-src http: 'unsafe-inline'; script-src http: 'unsafe-inline' 'unsafe-eval' data:; connect-src http: ws:; img-src *;");
    next();
});


app.use((req, res, next) => {
    console.log(`${req.method} request for '${req.url}' from ${req.ip}`);
    next();
});

// serving files ,,, index1 jumpoff point

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
    console.log('Served index1.html');
});

//init websocket serv

const wss = new WebSocket.Server({
    server: server,
    verifyClient: (info, callback) => {
        
        const origin = info.origin;
        console.log(`WebSocket connection attempt from origin: ${origin}`);
        
        if (allowedOrigins.includes(origin) || origin.endsWith('.onion')) {
            callback(true); 
            console.log('WebSocket connection accepted');
        } else {
            callback(false, 401, 'Unauthorized'); 
            console.log('WebSocket connection rejected: Unauthorized origin');
        }
    }
});

//cyber sec

function logInvalidAttempt(ip, origin, parameter) {
    const logMessage = `${new Date().toISOString()} - Invalid attempt from IP: ${ip}, Origin: ${origin}, Key: ${parameter}\n`;
    
    fs.appendFile('invalid_attempts.log', logMessage, (err) => {
        if (err) console.error('Error logging invalid attempt:', err);
    });
}

// encrption cypher funct

function encrypt(text, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

// check ket api ,,, cybersec limiter

app.post('/check-key', limiter, (req, res) => {
    const origin = req.get('origin');
    const ip = req.ip || req.connection.remoteAddress;
    const { parameter } = req.body;

    if (!allowedOrigins.includes(origin)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const keysMatch = parameter === secretKey;

    if (!keysMatch) {
        logInvalidAttempt(ip, origin, parameter); 
    }

    return res.status(200).json({ match: keysMatch });
});

// running funct ,,, interact with user

wss.on('connection', ws => {
    console.log('webSocket connection established');
    ws.on('message', message => {
        try {
            const data = JSON.parse(message); 

            const encryptedMessage = encrypt(JSON.stringify(data), secretKey);

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(encryptedMessage); 
                }
            });
        } catch (error) {
            console.error('error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('webSocket connection closed');
    });

    ws.on('error', (error) => {
        console.error('webSocket error:', error);
    });
});


// start serv er   

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('broken');
});

const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});


