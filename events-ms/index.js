// Includes
const express = require('express');
const { 
    createEvent, 
    publicEvents, 
    latestEvents, 
    eventByID, 
    currentUserEvents, 
    userEvents, 
    userPrivateEvents, 
    userPublicEvents 
} = require('./event_functions');
const { MongoClient } = require('mongodb');
const winston = require('winston');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

// Logger setup
const logger = winston.createLogger({
    level: 'info', // Set the desired log level
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Log in JSON format
    ),
    transports: [
        //new winston.transports.File({ name: 'error-fine', level: 'error', filename: 'error-log.txt'}), // Log errors to file
        new winston.transports.File({ name: 'info-file', level: 'info', filename: 'info-log.txt' }) // Log info to file
    ]
});

const app = express();
const port = 5051;
const { ObjectId } = require('mongodb');

// MiddleWare
app.use(express.json())
app.use((req,res,next)=>{
    console.log(req.path,req.method)
    next()
})

const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-haha'; 

// Function to verify JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Token verification failed
    }
  }
  
  // Middleware for JWT verification
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
      const decoded = verifyToken(token);
  
      if (decoded) {
        req.user = decoded; // Attach user info to request
        next();
      } else {
        res.sendStatus(403); // Forbidden
      }
    } else {
      res.sendStatus(401); // Unauthorized
    }
}

// MongoDB setup
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const uri = "mongodb+srv://" + username + ":" + password + "@eventschedulerprodb.db4jj.mongodb.net/";
let db;

const client = new MongoClient(uri);

client.connect()
    .then(() => {
        db = client.db('mydatabase');
        app.locals.db = db;
        logger.info('Connected successfully to MongoDB');

        app.listen(port, () => {
            console.log(`Server started on port: ${port}`);
            logger.info(`Server started on port: ${port}`);
        });
    })
    .catch(err => {
        logger.error(`Server startup failed! Error: ${err}`);
        process.exit(1);
    });

app.use((req, res, next) => {
    logger.info(`Received request for ${req.method} ${req.url}`);
    next();
});

// Create a new event
app.post('/create-new', authenticate, createEvent);

// Fetch all public events from the database
app.get('/public', publicEvents);

// Fetch 3 latest events
app.get('/latest', latestEvents);

// Define API route to get a single event by ID
app.get('/single/:id', eventByID);

// Fetch events owned by the current user
app.get('/user', authenticate, currentUserEvents);

// Fetch events for a specific user
app.get('/user/:userId', userEvents);

// Fetch private events for a specific user
app.get('/user/:userId/private', authenticate, userPrivateEvents);

// Fetch public events for a specific user
app.get('/user/:userId/public', userPublicEvents);

// Test api health
app.get('/health', (req, res) => {
    res.sendStatus(200);
  });