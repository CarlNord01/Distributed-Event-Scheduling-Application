const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-haha'; 

const createEvent = async (req, res) => {
    const db = req.app.locals.db; // Access the database from app.locals
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!req.app || !req.app.locals || !req.app.locals.db) {
            console.error('Database connection is not available.');
            return res.status(500).json({ message: 'Internal server error' });
        }

        const { title, singleDay, startDate, endDate, startTime, endTime, description, privateEvent } = req.body;

        if (!title || !startDate || !startTime || !endTime || (singleDay === false && !endDate)) {
            return res.status(400).json({ message: 'All required fields must be filled out.' });
        }

        const newEvent = {
            title,
            privateEvent,
            singleDay,
            startDate,
            endDate: singleDay ? startDate : endDate,
            startTime,
            endTime,
            description,
            owner: req.user.userId,
        };

        // Add await here
        const result = await req.app.locals.db.collection('events').insertOne(newEvent);

        res.status(201).json({ message: 'Event created successfully', eventId: result.insertedId });
    } catch (error) {
        console.error(`Error creating event: ${error}`);
        console.log('res in catch:', res); // Log res in the catch block
        res.status(500).json({ message: 'Failed to create event', error: error.message });
    }
};

const publicEvents = async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const publicEvents = await db.collection('events').find({ privateEvent: false }).toArray(); // Retrieve only public events
        res.status(200).json(publicEvents); // Send public events as JSON
    } catch (err) {
        console.error(`Failed to retrieve public events: ${err}`); // Log the error
        res.status(500).json({ message: 'Failed to retrieve public events', error: err.message });
    }
    return res;
}

const latestEvents = async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const events = await db.collection('events')
        .find({ privateEvent: false })
        .sort({ _id: -1 }) // Sort by _id in descending order (newest first)
        .limit(3) // Limit to the top 3 results
        .toArray();
  
        res.status(200).json(events); // Send events as JSON
    } catch (err) {
        console.error(`Failed to retrieve latest events: ${err}`); // Log the error
        res.status(500).json({ message: 'Failed to retrieve latest events', error: err.message });
    }
    return res;
}

const eventByID = async (req, res) => {
    try {
        const db = req.app.locals.db;
        const eventId = new ObjectId(req.params.id);
        const event = await db.collection('events').findOne({ _id: eventId });
  
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
    return res;
}

const currentUserEvents = async (req, res) => {
    const db = req.app.locals.db; // Access the database from app.locals
    try {
        const userId = req.user.userId;
    
        const events = await db.collection('events').find({ owner: userId }).toArray();
    
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Failed to fetch user events', error: error.message });
    }
    return res;
}

const userEvents = async (req, res) => {
    const db = req.app.locals.db; // Access the database from app.locals
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
    return res;
}

const userPrivateEvents = async (req, res) => {
    const db = req.app.locals.db; // Access the database from app.locals
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
        console.error('Error fetching user private events:', error);
        res.status(500).json({ message: 'Failed to fetch private events', error: error.message });
    }
    return res;
}

const userPublicEvents = async (req, res) => {
    const db = req.app.locals.db; // Access the database from app.locals
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
        console.error('Error fetching user private events:', error);
        res.status(500).json({ message: 'Failed to fetch private events', error: error.message });
    }
    return res;
}

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

module.exports = {
    createEvent,
    publicEvents,
    latestEvents,
    eventByID,
    currentUserEvents,
    userEvents,
    userPrivateEvents,
    userPublicEvents,
    verifySession
};