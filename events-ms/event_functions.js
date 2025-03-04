// NEED TO RESOLVE DEPENDENCIES: MONGODB
const createEvent = async (req, res) => {
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
      return res;
}

const publicEvents = async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const publicEvents = await db.collection('events').find({ privateEvent: false }).toArray(); // Retrieve only public events
        res.status(200).json(publicEvents); // Send public events as JSON
    } catch (err) {
        logger.error(`Failed to retrieve public events: ${err}`); // Log the error
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
  
        logger.info('Events found');
  
        res.status(200).json(events); // Send events as JSON
    } catch (err) {
        logger.error(`Failed to retrieve latest events: ${err}`); // Log the error
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
    return res;
}

const userEvents = async (req, res) => {
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
    return res;
}