// Includes
const express = require('express');
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
    origin: `http://9.223.201.161/`, // Your frontend URL
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
        logger.error(`Error registering user: ${error}`); // Log the error
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
        logger.error(`Login error: ${error}`); // Log the error
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
    logger.error(`Error creating event: ${error}`); // Log the error
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Fetch all public events from the database
app.get('/api/events/public', async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const publicEvents = await db.collection('events').find({ privateEvent: false }).toArray(); // Retrieve only public events
        res.status(200).json(publicEvents); // Send public events as JSON
    } catch (err) {
        logger.error(`Failed to retrieve public events: ${err}`); // Log the error
        res.status(500).json({ message: 'Failed to retrieve public events', error: err.message });
    }
});

// Fetch 3 latest events
app.get('/api/events/latest', async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const events = await db.collection('events')
        .find({ privateEvent: false })
        .sort({ _id: -1 }) // Sort by _id in descending order (newest first)
        .limit(3) // Limit to the top 3 results
        .toArray();

        logger.info('Events found');

        res.status(200).json(events); // Send events as JSON
    } catch (err) {
        logger.error(`Failed to retrieve latest events: ${err}`); // Log the error
        res.status(500).json({ message: 'Failed to retrieve latest events', error: err.message });
    }
});

// Define API route to get a single event by ID
app.get('/api/event/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const eventId = new ObjectId(req.params.id);
        const event = await db.collection('events').findOne({ _id: eventId });

        if (event) {
            logger.info('Event found');
            res.json(event);
        } else {
            logger.info('Event not found');
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (err) {
        logger.error('Error fetching event:', err);
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
        logger.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Failed to fetch user events', error: error.message });
    }
});

// Get user data by ID
app.get('/api/user/:userId', async (req, res) => {
try {
    const userId = req.params.userId;
    logger.info('Received userId:', userId);

    if (!ObjectId.isValid(userId)) {
    logger.info('Invalid ObjectId:', userId);
    return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } }
    );

    if (!user) {
    logger.info('User not found for ID:', userId);
    return res.status(404).json({ message: 'User not found' });
    }

    logger.info('User found:', user);
    res.status(200).json({ user });
    } catch (error) {
        logger.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
    }
});

// Get username and userId by ID
app.get('/api/user-summary/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        logger.info('Received userId:', userId);

        if (!ObjectId.isValid(userId)) {
            logger.info('Invalid ObjectId:', userId);
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Fetch only the _id and username fields
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { _id: 1, username: 1 } }
        );

        if (!user) {
            logger.info('User not found for ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        // Return only the necessary fields
        res.status(200).json({ userId: user._id, username: user.username });
    } catch (error) {
        logger.error('Error fetching user summary:', error);
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
        logger.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Failed to fetch user events', error: error.message });
    }
});

// Fetch private events for a specific user
app.get('/api/user/:userId/private-events', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Validate the userId
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Fetch private events created by the user
        const events = await db.collection('events').find({
            owner: userId,  // Match the owner ID
            privateEvent: true // Ensure the event is private
        }).toArray();

        res.status(200).json(events); // Send private events as JSON
    } catch (error) {
        logger.error('Error fetching user private events:', error);
        res.status(500).json({ message: 'Failed to fetch private events', error: error.message });
    }
});

// Fetch public events for a specific user
app.get('/api/user/:userId/public-events', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Validate the userId
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Fetch private events created by the user
        const events = await db.collection('events').find({
            owner: userId,  // Match the owner ID
            privateEvent: false // Ensure the event is public
        }).toArray();

        res.status(200).json(events); // Send private events as JSON
    } catch (error) {
        logger.error('Error fetching user private events:', error);
        res.status(500).json({ message: 'Failed to fetch private events', error: error.message });
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

        logger.info('Sender ID:', senderId);
        logger.info('Recipient ID:', userId);

        // Validate userId 
        if (!ObjectId.isValid(userId)) {
            logger.info('Invalid ObjectId:', userId);
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Convert userId and senderId to ObjectId
        const recipientObjectId = new ObjectId(userId);
        const senderObjectId = new ObjectId(senderId);

        // Check if the user is trying to send a request to themselves
        if (senderObjectId.equals(recipientObjectId)) {
            logger.info('User tried to send a request to themselves');
            return res.status(400).json({ message: 'Cannot send a friend request to yourself' });
        }

        // Check if a request already exists (either direction)
        const existingRequest = await db.collection('users').findOne({
            $or: [
                { _id: recipientObjectId, 'friendRequests.sender': senderObjectId }, // Request sent by sender to recipient
                { _id: senderObjectId, 'friendRequests.sender': recipientObjectId }  // Request sent by recipient to sender
            ]
        });

        logger.info('Existing request found:', existingRequest);

        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already exists' });
        }

        // Check if they are already friends (check both sides)
        const alreadyFriends = await db.collection('users').findOne({
            $or: [
                { _id: senderObjectId, friends: recipientObjectId }, // Sender has recipient in friends list
                { _id: recipientObjectId, friends: senderObjectId }  // Recipient has sender in friends list
            ]
        });

        logger.info('Already friends check result:', alreadyFriends);

        if (alreadyFriends) {
            logger.info('Users are already friends');
            return res.status(400).json({ message: 'You are already friends with this user' });
        }

        // Add the request to the recipient's friendRequests array
        await db.collection('users').updateOne(
            { _id: recipientObjectId },
            { $push: { friendRequests: { sender: senderObjectId } } }
        );

        logger.info('Friend request sent successfully');
        res.status(200).json({ message: 'Friend request sent.' });

    } catch (error) {
        logger.error('Error sending friend request:', error);
        res.status(500).json({ message: 'Error sending friend request.' });
    }
});

// Get Friend Requests
app.get('/api/friend-requests/:userId', async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        // Log the raw User ID from the request
        logger.info('Raw User ID:', req.params.userId);
        
        const userId = new ObjectId(req.params.userId);
        
        // Find the user by their ID and project only the friendRequests field
        const user = await db.collection('users').findOne(
            { _id: userId },
            { projection: { friendRequests: 1 } }
        );
        
        if (user) {
            logger.info('Friend Requests found:', user.friendRequests);
            res.json({ friendRequests: user.friendRequests });
        } else {
            logger.info('User not found');
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        logger.error('Error fetching friend requests:', err);
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
                $pull: { friendRequests: { sender: senderObjectId } }, // Remove the sender from friendRequests
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
        logger.error('Error accepting friend request:', error);
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
    const senderObjectId = new ObjectId(senderId);

    try {
        // Remove senderId from friendRequests
        await db.collection('users').updateOne(
            { _id: new ObjectId(recipientId) },
            {
                $pull: { friendRequests: { sender: senderObjectId } } // Remove from friendRequests
            }
        );

        res.status(200).json({ message: 'Friend request declined.' });
    } catch (error) {
        logger.error('Error declining friend request:', error);
        res.status(500).json({ message: 'Failed to decline friend request' });
    }
});

// Get Friends List
app.get('/api/friends', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    try {
        const userId = new ObjectId(req.session.user.userId); // Says deprecated, but since req.session.user.userId is a string we need to do this.
        logger.info(`Requested user id: ${userId}`);

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
                }
            }
        ]).toArray();

        res.status(200).json(user);
    } catch (error) {
        logger.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Error fetching friends.' });
    }
});

// Fetch all users from the database (only username and _id)
app.get('/api/users', async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const users = await db.collection('users')
            .find({}, { projection: { username: 1, _id: 1 } }) // Retrieve only username and _id fields
            .toArray();
        
        res.status(200).json(users);
        logger.info(`Found username: ${users.username}. User id: ${users._id}`);
    } catch (err) {
        logger.error('Failed to retrieve users:', err);
        res.status(500).json({ message: 'Failed to retrieve users', error: err.message });
    }
});

// Check friendness status
app.get('/api/friends/checkfriend/:userId2', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    try {
        const userId1 = req.session.user.userId;
        const { userId2 } = req.params;

        // Validate userId1 and userId2 (ensure they are valid ObjectIds)
        if (!ObjectId.isValid(userId1) || !ObjectId.isValid(userId2)) {
            logger.info("INVALID USER ID(s)");
            return res.status(400).json({ message: 'Invalid user ID(s)' });
        }

        const user1 = new ObjectId(userId1);
        const user2 = new ObjectId(userId2);

        // Check if user1 has user2 in their friends list
        const result = await db.collection('users').findOne({ 
            _id: user1, 
            friends: user2 
        });

        res.status(200).json(!!result);
    } catch (error) {
        logger.error('Error checking friend status:', error);
        res.status(500).json({ message: 'Error checking friend status.' });
    }
});

// Check pending friend request
app.get('/api/friends/checkfriend/request/:userId2', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    try {
        const userId1 = req.session.user.userId;
        const { userId2 } = req.params;

        // Validate userId1 and userId2 (ensure they are valid ObjectIds)
        if (!ObjectId.isValid(userId1) || !ObjectId.isValid(userId2)) {
            logger.info("INVALID USER ID(s)");
            return res.status(400).json({ message: 'Invalid user ID(s)' });
        }

        const user1 = new ObjectId(userId1);
        const user2 = new ObjectId(userId2);

        // Check if user2 has user1 in their friend request list
        const result = await db.collection('users').findOne({ 
            _id: user2, 
            friendRequests: {sender: user1}
        });
        res.status(200).json(!!result);
    } catch (error) {
        logger.error('Error checking friend request status:', error);
        res.status(500).json({ message: 'Error checking friend request status.' });
    }
});

// Remove friend
app.post('/api/friend/remove/:victim', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const killer = req.session.user.userId; // The logged-in user who is requesting removal
    const { victim } = req.params;

    try {
        const killerId = new ObjectId(killer);
        const victimId = new ObjectId(victim);

        // Update killer, remove victim from killer
        await db.collection('users').updateOne(
            { _id: killerId },
            {
                $pull: { friends: victimId }, // Remove the victim from friends
            }
        );

        // Update victim, remove killer from victim
        await db.collection('users').updateOne(
            { _id: victimId },
            {
                $pull: { friends: killerId } // Remove the killer from friends
            }
        );

        res.status(204).json({ message: 'Friend killed, how brutal...' });
    } catch (error) {
        logger.error('Error killing victim:', error);
        res.status(500).json({ message: 'Failed to kill victim. Police are on their way...' });
    }
});
