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
    userPublicEvents,
    verifySession 
} = require('./event_functions');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

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

// Create a new event
app.post('/create-new/:authToken', verifySession, createEvent);

// Fetch all public events from the database
app.get('/public', publicEvents);

// Fetch 3 latest events
app.get('/latest', latestEvents);

// Define API route to get a single event by ID
app.get('/single/:id', eventByID);

// Fetch events owned by the current user
app.get('/user/current/:authToken', verifySession, currentUserEvents);

// Fetch events for a specific user
app.get('/user/:userId', userEvents);

// Fetch private events for a specific user
app.get('/user/private/:userId/:authToken', verifySession, userPrivateEvents);

// Fetch public events for a specific user
app.get('/user/public/:userId', userPublicEvents);

// Test api health
app.get('/health', (req, res) => {
    res.sendStatus(200);
  });