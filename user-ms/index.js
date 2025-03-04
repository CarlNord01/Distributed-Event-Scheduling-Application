// Includes
const express = require('express');
const { registerUser, loginUser, userDataByID, userSummary, logoutUser, allUsers } = require('./user_functions');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session'); // Import express-session
require('dotenv').config();
const winston = require('winston');

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

// Import routes
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const port = 5001; // Or any port of your choice
const { ObjectId } = require('mongodb');

// Middleware
app.use(express.json());
app.use(cors({
    origin: `http://9.223.201.161`, // Your frontend URL
    credentials: true
}));

app.use((req, res, next) => {
    console.log("Session Data:", req.session);
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey', // Use a secure secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false, // Use secure cookies in production
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
        sameSite: "none"
    }
}));


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
            console.log(`Server is running!`);
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

// Register new user
app.post('/user/register', registerUser);

// Login endpoint
app.post('/user/login', loginUser);

// Get user data by ID
app.get('/user/:userId', userDataByID);

// Get username and userId by ID
app.get('/user/summary/:userId', userSummary);

// Logout endpoint
app.post('/user/logout', logoutUser);

// Fetch all users from the database (only username and _id)
app.get('/api/users', allUsers);