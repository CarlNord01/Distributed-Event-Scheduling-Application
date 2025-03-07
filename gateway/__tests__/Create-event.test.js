const { createEvent } = require('../../events-ms/event_functions');

describe('createEvent function', () => {
    let req, res, db;

    beforeEach(() => {
        req = {
            user: { userId: 'user123' },
            body: {
                title: 'Sample Event',
                singleDay: true,
                startDate: '2025-03-01',
                startTime: '10:00',
                endTime: '12:00',
            },
            app: {
                locals: {
                    db: {
                        collection: jest.fn().mockReturnThis(),
                        insertOne: jest.fn(), // Initialize as a mock
                    },
                },
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        db = req.app.locals.db; // Store the db mock for easier access
    });

    it('should create an event successfully', async () => {
        // Mock insertOne to resolve with a result
        db.insertOne.mockResolvedValue({ insertedId: 'event123' });

        await createEvent(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: 'Event created successfully', eventId: 'event123' });
    });

    it('should return 401 if req.user is undefined', async () => {
        req.user = undefined;

        await createEvent(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
        req.body.title = '';

        await createEvent(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'All required fields must be filled out.' });
    });

    it('should return 500 if there is a database error', async () => {
        // Mock insertOne to reject with an error
        db.insertOne.mockRejectedValue(new Error('Database error'));

        await createEvent(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create event', error: 'Database error' });
    });
});