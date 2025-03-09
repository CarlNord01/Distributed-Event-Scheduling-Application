const { ObjectId } = require('mongodb');

const sendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user.userId; // Get senderId from JWT

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
    return res;
}

const listRequests = async (req, res) => {
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
}

const acceptRequest = async (req, res) => {
    try {
        const recipientId = req.user.userId; // The logged-in user who is accepting the request
        const { senderId } = req.params;

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
}

const declineRequest = async (req, res) => {
    try {
        const recipientId = req.user.userId;
        const { senderId } = req.params;
        const senderObjectId = new ObjectId(senderId);

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
}

const listFriends = async (req, res) => {
    try {
        const userId = new ObjectId(req.user.userId);
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
}

const checkFriendness = async (req, res) => {
    try {
        const userId1 = req.user.userId;
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
}

const checkFriendRequestStatus = async (req, res) => {
    try {
        const userId1 = req.user.userId;
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
}

const removeFriend = async (req, res) => {
    const killer = req.user.userId; // The logged-in user who is requesting removal
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
}

module.exports = {
    sendRequest,
    listRequests,
    acceptRequest,
    declineRequest,
    listFriends,
    checkFriendness,
    checkFriendRequestStatus,
    removeFriend
};