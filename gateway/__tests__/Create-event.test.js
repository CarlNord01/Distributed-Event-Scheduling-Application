jest.mock('http-proxy-middleware', () => ({
    createProxyMiddleware: jest.fn().mockImplementation(() => (req, res) => {
      if (req.url === '/error') {
        return res.status(500).json({ message: "Internal server error" });
      }
      return res.status(200).json({ message: "Mocked proxy response" });
    })
  }));
  
  const request = require('supertest');
  const { app } = require('../index'); // Import app after mocking
  const db = require('../db');
  const jwt = require('jsonwebtoken'); // Required to generate JWT tokens for testing
  
  jest.mock('../db'); // Mock the database module
  
  describe('POST /events/create-new', () => {
    let validToken;
  
    // Generate a valid JWT token before all tests
    beforeAll(() => {
      validToken = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET || 'very-secret-haha', { expiresIn: '1h' });
    });
  
    it('should create a new event successfully (Happy Path)', async () => {
      const newEvent = {
        title: 'Sample Event',
        singleDay: true,
        startDate: '2025-03-01',
        startTime: '10:00',
        endTime: '12:00',
        description: 'Sample event description',
        privateEvent: false,
      };
  
      // Mock the db.connectDB method to return a mocked database response
      db.connectDB.mockResolvedValueOnce({
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'event123' }), // Simulate successful insert
        }),
      });
  
      // Send request with valid JWT token in Authorization header
      const response = await request(app)
        .post('/events/create-new')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newEvent);
  
      // Expect status 201 and correct message
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.eventId).toBe('event123');
    });
  
    it('should return 401 if the user is not logged in (Unauthorized)', async () => {
      const newEvent = {
        title: 'Sample Event',
        singleDay: true,
        startDate: '2025-03-01',
        startTime: '10:00',
        endTime: '12:00',
        description: 'Sample event description',
        privateEvent: false,
      };
  
      // Send request with no JWT or invalid JWT in Authorization header
      const response = await request(app)
        .post('/events/create-new')
        .set('Authorization', 'Bearer invalid-token')
        .send(newEvent);
  
      // Expect status 401 for unauthorized access
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized. Please log in to create an event.');
    });
  
    it('should return 400 if required fields are missing', async () => {
      const newEvent = {
        title: '',
        singleDay: true,
        startDate: '',
        startTime: '',
        endTime: '12:00',
        description: 'Sample event description',
        privateEvent: false,
      };
  
      // Send request with valid JWT token but missing fields
      const response = await request(app)
        .post('/events/create-new')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newEvent);
  
      // Expect status 400 for bad request due to missing required fields
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All required fields must be filled out.');
    });
  
    it('should return 500 if there is a database error', async () => {
      const newEvent = {
        title: 'Sample Event',
        singleDay: true,
        startDate: '2025-03-01',
        startTime: '10:00',
        endTime: '12:00',
        description: 'Sample event description',
        privateEvent: false,
      };
  
      // Mock the database call to simulate an error
      db.connectDB.mockResolvedValueOnce({
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockRejectedValue(new Error('Database error')), // Simulate a DB error
        }),
      });
  
      // Send request with valid JWT token but trigger a DB error
      const response = await request(app)
        .post('/events/create-new')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newEvent);
  
      // Expect status 500 for internal server error due to DB issue
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to create event');
      expect(response.body.error).toBe('Database error');
    });
  });
  