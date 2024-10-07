import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard'; 
import { Button, Grid2 } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';



const handleAddFriendButtonClick = async (targetUserId) => {
  try {
    // Make POST request to backend
    axios.post(`http://localhost:5001/api/friend-request/${targetUserId}`, { withCredentials: true })
      .then((response) => {
        // Update UI to notify the user of success! 
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.error('Friend request failed:', error.response);
        }
      });
  } catch (error) {
    // Check if the response contains a message
    if (error.response && error.response.data) {
        console.error('Friend request failed:', error.response.data.message);
    } else {
        console.error('Friend request failed:', error);
    }
  }
};

function ProfilePage() {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user data and events
  useEffect(() => {
    // Fetch user data
    axios.get(`http://localhost:5001/api/user/${userId}`)
      .then(response => {
        setUser(response.data.user);

        // Fetch user's events
        axios.get(`http://localhost:5001/api/user/${userId}/events`)
          .then(eventsResponse => {
            setEvents(eventsResponse.data);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching user events:', error);
            setErrorMessage('Failed to load user events.');
            setLoading(false);
          });
      })
      .catch(error => {
        console.error('Error fetching user data', error);
        setErrorMessage('User not found.');
        setLoading(false);
      });
  }, [userId]);

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

  return (
    <div className="Content">
      <h1 className='PageTitle'>{user.username}</h1>
      <div className="UserInfo">
        <p><strong>Username:</strong> {user.username}</p>
        {/* Optionally display email if appropriate */}
        {/* <p><strong>Email:</strong> {user.email}</p> */}
        <Button 
          variant='contained'
          onClick={() => {
            handleAddFriendButtonClick(userId);
          }}
        >
          Add Friend
        </Button>
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
    </div>
  );
}

export default ProfilePage;