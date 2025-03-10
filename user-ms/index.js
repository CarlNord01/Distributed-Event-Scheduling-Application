// Includes
const express = require('express');
const { 
    registerUser, 
    loginUser, 
    verifySession,
    logoutUser,
    userDataByID, 
    userSummary,  
    allUsers 
} = require('./user_functions');
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
const port = 5050;
const { ObjectId } = require('mongodb');

// MiddleWare
app.use(express.json()); // VERY HUNGRY EATS DATA!!!
app.use((req,res,next)=>{
    console.log(req.path,req.method);
    console.log('Raw body data:', req.body);
    next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-haha'; 

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
        console.log('Connected successfully to MongoDB');

        app.listen(port, () => {
            console.log(`Server started on port: ${port}`);
        });
    })
    .catch(err => {
        console.error(`Server startup failed! Error: ${err}`);
        process.exit(1);
    });

// Register new user
app.post('/register/', registerUser);

// Login endpoint
app.post('/login/', loginUser);

// Validate session token endpoint
app.get('/session/:authToken/', verifySession, (req, res) => {
    res.status(200).json({ user: req.user });
});
// Logout endpoint
app.post('/logout/', logoutUser);

// Get user data by ID
app.get('/data/:userId/', userDataByID);

// Get username and userId by ID
app.get('/summary/:userId/', userSummary);

// Fetch all users from the database (only username and _id)
app.get('/all/', allUsers);

// Test api health
app.get('/health', (req, res) => {
    res.sendStatus(200);
  });