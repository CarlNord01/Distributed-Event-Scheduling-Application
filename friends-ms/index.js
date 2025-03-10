// Includes
const express = require('express');
const { sendRequest,
    listRequests,
    acceptRequest,
    declineRequest,
    listFriends,
    checkFriendness,
    checkFriendRequestStatus,
    removeFriend 
} = require('./friend_functions');
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
const port = 5052;
const { ObjectId } = require('mongodb');

// MiddleWare
app.use(express.json())
app.use((req,res,next)=>{
    console.log(req.path,req.method)
    next()
})

const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-haha'; 

// Middleware for JWT verification
const verifySession = (req, res, next) => {
    const token = req.params.authToken;
  
    if (token) {
        console.log('Token value:', token);
    
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }

            req.user = user; // Attach user information to the request
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

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

// Send friend request
app.post('/request/:userId/:authToken/', verifySession, sendRequest);

// Get Friend Requests
app.get('/list-requests/:userId/:authToken/', verifySession, listRequests);

// Accept Friend Request
app.post('/request/accept/:senderId/:authToken/', verifySession, acceptRequest);

// Decline Friend Request
app.post('/request/decline/:senderId/:authToken/', verifySession, declineRequest);

// Get Friends List
app.get('/list/:authToken/', verifySession, listFriends);

// Check friendness status
app.get('/checkfriend/:userId2/:authToken/', verifySession, checkFriendness);

// Check pending friend request
app.get('/checkfriend/request/:userId2/:authToken/', verifySession, checkFriendRequestStatus);

// Remove friend
app.post('/remove/:victim/:authToken/', verifySession, removeFriend);

// Test api health
app.get('/health/', async (req, res) => {
    res.sendStatus(200);
});