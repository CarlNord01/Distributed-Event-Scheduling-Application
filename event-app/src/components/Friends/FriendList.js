import React, {useEffect, useState} from 'react';
import FriendCard from './FriendCard';
import { getUserFriends } from '../../model-data/FriendData';
import { findSession } from '../../model-data/UserData';

function FriendList() {
  const [userId, setUserId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user session to get userId
  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionStatus = await findSession();
        if (sessionStatus.status == 200) {
          setUserId(sessionStatus.user.userId);
        } 
      } catch (error) {
        console.error('Error verifying session:', error);
        setError(error);
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  // Fetch friend list
  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => { 
      setLoading(true);
      try {
        const fetchedFriends = await getUserFriends(); // Await getUserFriends
        setFriends(fetchedFriends);
      } catch (error) {
        console.error('Error fetching friends:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchFriends();
  }, [userId]);

  // Handle loading state
  if (loading) {
    return <div>Loading friend requests...</div>;
  }

  // Handle error state
  if (error) {
      return <div>Error loading friend requests: {error.message}</div>;
  }

  // Handle no friend requests state
  if (friends.length === 0) {
      return <div>You have no friends lol</div>;
  }

  return (
    <div style={{ 
      width: '80%'
    }}>
        <ul style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        flexDirection: 'column',
        listStyle: 'none', 
        padding: 0, 
        margin: 0
      }}>
        {friends.map(friend => (
          <li key={friend.id} style={{ marginRight: '1rem' }}>
            <FriendCard id={friend.id} name={friend.username} /> 
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FriendList;
