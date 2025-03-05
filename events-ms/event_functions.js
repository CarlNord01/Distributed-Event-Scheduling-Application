const createEvent = async (req, res) => {
    try {
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
        owner: req.user.userId
      };
  
      // Save the event to the database
      const result = await db.collection('events').insertOne(newEvent);
  
      return res.status(201).json({ message: 'Event created successfully', eventId: result.insertedId });
  
    } catch (error) {
      console.error(`Error creating event: ${error.message}`);
  
      return res.status(500).json({ message: 'Failed to create event', error: error.message });
    }
  };  