const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session'); // Import express-session
require('dotenv').config();

// Import routes
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const port = 5001; // Or any port of your choice
const { ObjectId } = require('mongodb');

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true // Allow cookies to be sent with requests
}));

// Configure sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey', // Use a secure secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false // Set this to `true` if using HTTPS
    }
}));

// MongoDB setup
const username = "JesperW";
const password = "ZY2Z4LVbO073TpC0";
const uri = "mongodb+srv://" + username + ":" + password + "@eventschedulerprodb.db4jj.mongodb.net/";
let db;

const client = new MongoClient(uri);

client.connect()
    .then(() => {
        db = client.db('mydatabase'); // Initialize the database
        app.locals.db = db; // Attach db to app.locals
        console.log('Connected successfully to MongoDB');

        // Start server after successful DB connection
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1); // Exit process with failure code
    });
    
app.use((req, res, next) => {
    console.log(`Received request for ${req.method} ${req.url}`);
    next();
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Basic validation
        if (!email || !username || !password) {
            return res.status(400).json({ message: 'Email, username, and password are required.' });
        }

        // Convert the username to lowercase before storing
        const normalizedUsername = username.toLowerCase();
        const normalizedEmail = email.toLowerCase();

        // Check if the email or username already exists in the database
        const existingUser = await db.collection('users').findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        });

        if (existingUser) {
            // Check which field is already taken
            if (existingUser.email === normalizedEmail) {
                return res.status(400).json({ message: 'Email is already taken.' });
            } else if (existingUser.username === normalizedUsername) {
                return res.status(400).json({ message: 'Username is already taken.' });
            }
        }

        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save the user to the database
        const result = await db.collection('users').insertOne({
            email: normalizedEmail,
            username: normalizedUsername,
            password: hashedPassword,
            friends: [],
            friendRequests: []
        });

        res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
    } catch (error) {
        console.error('Error registering user:', error); // Log the error
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Convert the username to lowercase before querying
        const normalizedUsername = username.toLowerCase();

        // Find the user in the database
        const user = await db.collection('users').findOne({ username: normalizedUsername });

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Create session upon successful login
        req.session.user = {
            userId: user._id,
            username: user.username,
            email: user.email
        };

        // Authentication successful
        return res.status(200).json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error });
    }
});

// Endpoint to get the current session user
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'No active session' });
    }
});

// Create a new event
app.post('/api/create-new-event', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized. Please log in to create an event.' });
    }

    const { title, singleDay, startDate, endDate, startTime, endTime, description, privateEvent } = req.body;

    // Basic validation
    if (!title || !startDate || !startTime || !endTime || (singleDay === false && !endDate)) {
      return res.status(400).json({ message: 'All required fields must be filled out.' });
    }

    // Prepare the event data
    const newEvent = {
      title,
      privateEvent,
      singleDay,
      startDate,
      endDate: singleDay ? startDate : endDate,
      startTime,
      endTime,
      description,
      owner: req.session.user.userId
    };

    // Save the event to the database
    const result = await db.collection('events').insertOne(newEvent);

    res.status(201).json({ message: 'Event created successfully', eventId: result.insertedId });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Fetch all events from the database
app.get('/api/events', async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const events = await db.collection('events').find().toArray(); // Retrieve all events
        res.status(200).json(events); // Send events as JSON
    } catch (err) {
        console.error('Failed to retrieve events:', err);
        res.status(500).json({ message: 'Failed to retrieve events', error: err.message });
    }
});

// Define API route to get a single event by ID
app.get('/api/event/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        // Log the raw ID from the request
        console.log('Raw Event ID:', req.params.id);
        
        const eventId = new ObjectId(req.params.id);
        
        const event = await db.collection('events').findOne({ _id: eventId });
        
        if (event) {
            console.log('Event found:', event);
            res.json(event);
        } else {
            console.log('Event not found');
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Fetch events owned by the current user
app.get('/api/user/events', async (req, res) => {
try {
    if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized. Please log in to view your events.' });
    }

    const userId = req.session.user.userId;

    const events = await db.collection('events').find({ owner: userId }).toArray();

    res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Failed to fetch user events', error: error.message });
    }
});

// Get user data by ID
app.get('/api/user/:userId', async (req, res) => {
try {
    const userId = req.params.userId;
    console.log('Received userId:', userId);

    if (!ObjectId.isValid(userId)) {
    console.log('Invalid ObjectId:', userId);
    return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } }
    );

    if (!user) {
    console.log('User not found for ID:', userId);
    return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user);
    res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
    }
});

// Get username and userId by ID
app.get('/api/user-summary/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Received userId:', userId);

        if (!ObjectId.isValid(userId)) {
            console.log('Invalid ObjectId:', userId);
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Fetch only the _id and username fields
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { _id: 1, username: 1 } }
        );

        if (!user) {
            console.log('User not found for ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        // Return only the necessary fields
        res.status(200).json({ userId: user._id, username: user.username });
    } catch (error) {
        console.error('Error fetching user summary:', error);
        res.status(500).json({ message: 'Failed to fetch user summary', error: error.message });
    }
});

// Fetch events for a specific user
app.get('/api/user/:userId/events', async (req, res) => {
try {
    const userId = req.params.userId;

    // Validate the userId
    if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch events created by the user
    const events = await db.collection('events').find({ owner: userId }).toArray();

    res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Failed to fetch user events', error: error.message });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed', error: err });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Friend request
app.post('/api/friend-request/:userId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in to send friend requests' });
    }

    try {
        const { userId } = req.params;
        const senderId = req.session.user.userId; // Get senderId from session

        console.log('Sender ID:', senderId);
        console.log('Recipient ID:', userId);

        // Validate userId 
        if (!ObjectId.isValid(userId)) {
            console.log('Invalid ObjectId:', userId);
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Convert userId and senderId to ObjectId
        const recipientObjectId = new ObjectId(userId);
        const senderObjectId = new ObjectId(senderId);

        // Check if the user is trying to send a request to themselves
        if (senderObjectId.equals(recipientObjectId)) {
            console.log('User tried to send a request to themselves');
            return res.status(400).json({ message: 'Cannot send a friend request to yourself' });
        }

        // Check if a request already exists (either direction)
        const existingRequest = await db.collection('users').findOne({
            $or: [
                { _id: recipientObjectId, 'friendRequests.sender': senderObjectId }, // Request sent by sender to recipient
                { _id: senderObjectId, 'friendRequests.sender': recipientObjectId }  // Request sent by recipient to sender
            ]
        });

        console.log('Existing request found:', existingRequest);

        if (existingRequest) {
            console.log('Friend request already exists between these users');
            return res.status(400).json({ message: 'Friend request already exists' });
        }

        // Check if they are already friends (check both sides)
        const alreadyFriends = await db.collection('users').findOne({
            $or: [
                { _id: senderObjectId, friends: recipientObjectId }, // Sender has recipient in friends list
                { _id: recipientObjectId, friends: senderObjectId }  // Recipient has sender in friends list
            ]
        });

        console.log('Already friends check result:', alreadyFriends);

        if (alreadyFriends) {
            console.log('Users are already friends');
            return res.status(400).json({ message: 'You are already friends with this user' });
        }

        // Add the request to the recipient's friendRequests array
        await db.collection('users').updateOne(
            { _id: recipientObjectId },
            { $push: { friendRequests: { sender: senderObjectId } } }
        );

        console.log('Friend request sent successfully');
        res.status(200).json({ message: 'Friend request sent.' });

    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ message: 'Error sending friend request.' });
    }
});

// Get Friend Requests
app.get('/api/friend-requests/:userId', async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        // Log the raw User ID from the request
        console.log('Raw User ID:', req.params.userId);
        
        const userId = new ObjectId(req.params.userId);
        
        // Find the user by their ID and project only the friendRequests field
        const user = await db.collection('users').findOne(
            { _id: userId },
            { projection: { friendRequests: 1 } }
        );
        
        if (user) {
            console.log('Friend Requests found:', user.friendRequests);
            res.json({ friendRequests: user.friendRequests });
        } else {
            console.log('User not found');
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching friend requests:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Accept Friend Request
app.post('/api/friend-request/accept/:senderId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const recipientId = req.session.user.userId; // The logged-in user who is accepting the request
    const { senderId } = req.params;

    try {
        const recipientObjectId = new ObjectId(recipientId);
        const senderObjectId = new ObjectId(senderId);

        // Update recipient: Remove from friendRequests and add to friends
        await db.collection('users').updateOne(
            { _id: recipientObjectId },
            {
                $pull: { friendRequests: { sender: senderId } }, // Remove the sender from friendRequests
                $addToSet: { friends: senderObjectId }           // Add the sender to recipient's friends list
            }
        );

        // Update sender: Add the recipient to sender's friends list
        await db.collection('users').updateOne(
            { _id: senderObjectId },
            {
                $addToSet: { friends: recipientObjectId }         // Add the recipient to sender's friends list
            }
        );

        res.status(200).json({ message: 'Friend request accepted and friendship established.' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ message: 'Failed to accept friend request' });
    }
});

// Reject Friend Request
app.post('/api/friend-request/decline/:senderId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const recipientId = req.session.user.userId;
    const { senderId } = req.params;

    try {
        // Remove senderId from friendRequests
        await db.collection('users').updateOne(
            { _id: new ObjectId(recipientId) },
            {
                $pull: { friendRequests: { sender: senderId } } // Remove from friendRequests
            }
        );

        res.status(200).json({ message: 'Friend request declined.' });
    } catch (error) {
        console.error('Error declining friend request:', error);
        res.status(500).json({ message: 'Failed to decline friend request' });
    }
});

// Get Friends List
app.get('/api/friends', async (req, res) => {
    try {
        const userId = req.session.user.userId;

        const user = await db.collection('users').aggregate([
            { $match: { _id: userId } },
            { $unwind: '$friends' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'friends',
                    foreignField: '_id',
                    as: 'friendDetails'
                }
            },
            { $unwind: '$friendDetails' },
            {
                $project: {
                    _id: '$friendDetails._id',
                    username: '$friendDetails.username',
                    // ... other fields to include
                }
            }
        ]).toArray();

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Error fetching friends.' });
    }
});