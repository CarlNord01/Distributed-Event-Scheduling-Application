const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config(); // Load environment variables

const app = express();

// Middleware to parse request body
app.use(express.json());
app.use(cors({
    origin: `http://9.223.201.161`, // Frontend URL
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-haha'; 

// Proxy Middleware with JWT verification
function createDynamicProxy(targetIP) {
    return createProxyMiddleware({
        target: `http://${targetIP}`,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }

            // Forward JWT in Authorization header
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }
        },
        onError: (err, req, res) => {
          console.error("Proxy Error:", err);
          res.status(500).send({ error: "Proxy error occurred" });
        }
    });
}

app.use('/events', createDynamicProxy('localhost:5051'));          // events-ms
app.use('/user', createDynamicProxy('localhost:5050'));            // user-ms
app.use('/friends', createDynamicProxy('localhost:5052'));          // friends-ms

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.all('*', (req, res) => {
  res.status(404).send('Error: Not found');
});

// Only start the server if not in the test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(5000, () => {
    console.log(`Gateway server is running on port 5000`);
  });
}

// Export app for testing purposes (don't start server here)
module.exports = { app, createDynamicProxy };