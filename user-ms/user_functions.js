const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-haha'; 

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Adjust expiration as needed
}

const registerUser = async (req, res) => {
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
        console.error(`Error registering user: ${error}`); // Log the error
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
}

const loginUser = async (req, res) => {
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

        // Generate JWT upon successful login
        const payload = { 
            userId: user._id.toString(), // Convert ObjectId to string
            username: user.username, 
            email: user.email 
        };
        const token = generateToken(payload);

        // Send token as cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: false, // false for http
            sameSite: 'none', // recommended for security
            maxAge: 3600000, // 1 hour (matching token expiration)
            path: '/', // path where token is valid
          });

        // Authentication successful
        return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error(`Login error: ${error}`); // Log the error
        res.status(500).json({ message: 'Login failed', error });
    }
}

const verifySession = (req, res, next) => {
    const token = req.cookies.authToken;
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      req.user = decoded; // Store the decoded user info in req.user
      next();
    })
};
  
const logoutUser = (req, res) => {
    res.clearCookie('authToken', { // Clear the cookie
        httpOnly: true,
        secure: false,
        sameSite: 'none', 
        maxAge: 3600000,
        path: '/',
    });
  
    return res.status(200).json({ message: 'Logout successful' });
  };

const userDataByID = async (req, res) => {
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
    return res;
}

const userSummary = async (req, res) => {
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
    return res;
}

const allUsers = async (req, res) => {
    try {
        const db = req.app.locals.db; // Access the database from app.locals
        const users = await db.collection('users')
            .find({}, { projection: { username: 1, _id: 1 } }) // Retrieve only username and _id fields
            .toArray();
        
        res.status(200).json(users);
        console.log(`Found username: ${users.username}. User id: ${users._id}`);
    } catch (err) {
        console.error('Failed to retrieve users:', err);
        res.status(500).json({ message: 'Failed to retrieve users', error: err.message });
    }
    return res;
}

module.exports = {
    registerUser,
    loginUser,
    verifySession,
    logoutUser,
    userDataByID,
    userSummary,
    allUsers
};