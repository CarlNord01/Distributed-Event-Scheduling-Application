import React, { useEffect, useState } from 'react';
import RequestCard from './RequestCard';
import { findSession } from '../../model-data/UserData';

function RequestList() {
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const IP_ADDRESS = 'http://9.223.136.195';

    // Fetch current user session to get userId
    useEffect(() => {
        const verifySession = async () => {
            try {
              const sessionStatus = await findSession();
              if (sessionStatus.status == 200) {
                // Get userId from localstorage
                const userString = localStorage.getItem('user');
                const userObject = JSON.parse(userString);
                
                setUserId(userObject.userId);
              } else {
                console.log('userId not found');
              }
            } catch (error) {
              console.error('Error verifying session:', error);
              setError(error);
            } finally {
              setLoading(false);
            }
          };
          verifySession();
    }, []);

    // Fetch friend requests using userId
    useEffect(() => {
        if (!userId) return;

        const fetchFriendRequests = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${IP_ADDRESS}/friends/list-requests/${userId}/${token}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const requests = data.friendRequests; // Expect array of { sender: senderId }

                // Fetch usernames for each request
                const requestsWithUsernames = await Promise.all(requests.map(async (request) => {
                  try {
                      const userResponse = await fetch(`${IP_ADDRESS}/user/summary/${request.sender}`, {
                          credentials: 'include'
                      });
              
                      if (!userResponse.ok) {
                          throw new Error(`HTTP error! status: ${userResponse.status}`);
                      }
              
                      const userData = await userResponse.json();
                      
                      // The response now directly contains userId and username
                      console.log(`User summary for ${request.sender}:`, userData);
              
                      return { ...request, username: userData.username };
                  } catch (userError) {
                      console.error('Error fetching user summary:', userError);
                      return { ...request, username: 'Unknown User' };
                  }
              }));

                setFriendRequests(requestsWithUsernames);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching friend requests:', error);
                setError(error);
                setLoading(false);
            }
        };

        fetchFriendRequests();
    }, [userId]);

  const handleAccept = (senderId) => {
      setFriendRequests(prevRequests => prevRequests.filter(request => request.sender !== senderId));
  };

  const handleDecline = (senderId) => {
      setFriendRequests(prevRequests => prevRequests.filter(request => request.sender !== senderId));
  };

    // Handle loading state
    if (loading) {
        return <div>Loading friend requests...</div>;
    }

    // Handle error state
    if (error) {
        return <div>Error loading friend requests: {error.message}</div>;
    }

    // Handle no friend requests state
    if (friendRequests.length === 0) {
        return <div>No friend requests.</div>;
    }

    // Render the list of friend requests
    return (
        <div style={{margin: '0 auto' }}>
            <ul style={{
                display: 'flex',
                flexDirection: 'column',
                listStyle: 'none',
                padding: 0,
                margin: 0
            }}>
                {friendRequests.map((friend, index) => (
                    <li key={friend.sender || index} style={{ marginBottom: '1rem' }}>
                        <RequestCard
                            id={friend.sender}
                            name={friend.username} // Includes the username from user API
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default RequestList;
