import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard'; 
import { Button, Grid2 } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { checkFriend, sendFriendRequest, checkPendingRequest, killFriend } from '../model-data/FriendData';

function ProfilePage() {
  const [session, setSession] = useState(null); // Store session
  const { userId } = useParams();
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setPendingRequest] = useState(false);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Check local storage for user information on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setSession(storedUser);
    }
  }, []);

  useEffect(() => {
    if (!userId || !session) return;  // Ensure both userId and session are available

    // Fetch user data
    axios.get(`http://9.223.106.132:80/api/user/${userId}`)
      .then(response => {
        setUser(response.data.user);
      })
      .catch(error => {
        console.error('Error fetching user data', error);
        setErrorMessage('User not found.');
        setLoading(false);
      });

    // Function to fetch events
    const fetchEvents = async () => {
      setLoading(true);

      try {
        const isOwner = session && session.userId === userId; // Check if viewing own profile
        if (isOwner) {
          // If viewing own profile, fetch all events
          const eventsResponse = await axios.get(`http://9.223.106.132:80/api/user/${userId}/events`);
          setEvents(eventsResponse.data);
        } else {
          // Fetch friend status
          const friendStatus = await checkFriend(userId);
          setIsFriend(friendStatus);

          if (friendStatus) {
            // If they are friends, fetch all events (public and private)
            const eventsResponse = await axios.get(`http://9.223.106.132:80/api/user/${userId}/events`);
            setEvents(eventsResponse.data);
          } else {
            // If not friends, fetch only public events
            const eventsResponse = await axios.get(`http://9.223.106.132:80/api/user/${userId}/public-events`);
            setEvents(eventsResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setErrorMessage('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch friend request status
    const fetchRequestStatus = async () => {
      setLoading(true);
      try {
        const friendStatus = await checkPendingRequest(userId);
        setPendingRequest(friendStatus);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        setErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestStatus();
    fetchEvents();

  }, [userId, session]);  // Add session as a dependency to ensure it runs when session is available

  if (loading) {
    return (
      <div className="loading">
        <CircularProgress />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="error-message">
        {errorMessage}
      </div>
    );
  }

  const isOwner = session && session.userId === userId;

  return (
    <div className="Content">
      {user ? (
        <>
          <h1 className='PageTitle'>{user.username}</h1>
          <div className="UserInfo">
            {!isOwner && (
              isFriend ? (
                <Button 
                  variant='contained'
                  color='error'
                  onClick={() => {
                    killFriend(userId);
                    window.location.reload();
                }}>
                  Remove Friend
                </Button>
              ) : (
                hasPendingRequest ? (
                  <Button 
                    variant='outlined'
                    disabled={true}
                    >
                    Pending
                  </Button>
                ) : (
                  <Button 
                    variant='contained'
                    onClick={() => {
                    sendFriendRequest(userId);
                    window.location.reload();
                  }}>
                    Add Friend
                  </Button>
                )
              )
            )}
          </div>

          <h2>{user.username}'s Events</h2>
          {events.length === 0 ? (
            <p>{user.username} has not created any events yet.</p>
          ) : (
            <Grid2 container spacing={2} justifyContent="center">
              {events.map(event => (
                <Grid2 item xs={12} sm={6} md={4} lg={3} key={event._id}>
                  <EventCard
                    id={event._id}
                    title={event.title}
                    startDate={event.startDate}
                    endDate={event.endDate}
                    startTime={event.startTime}
                    endTime={event.endTime}
                    description={event.description}
                    singleDay={event.singleDay}
                  />
                </Grid2>
              ))}
            </Grid2>
          )}
        </>
      ) : (
        <p>Loading user...</p> 
      )}
    </div>
  );
}

export default ProfilePage;
