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

app.use((req,res,next)=>{
  console.log(req.path,req.method);
  console.log('Request body (raw):', req.body);
  next();
});

app.use('/events', createDynamicProxy('10.0.156.226'));          // events-ms
app.use('/user', createDynamicProxy('10.0.100.149'));            // user-ms
app.use('/friends', createDynamicProxy('10.0.74.62'));           // friends-ms

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.all('*', (req, res) => {
  res.status(404).send('Error: Not found');
});

const server = app.listen(5000, () => {
  console.log(`Gateway server is running on port 5000`);
});

// Export server for testing
module.exports = { app, server, createDynamicProxy };
