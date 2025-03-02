import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, CardContent, Divider, Box, Stack } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import dayjs from 'dayjs';

function EventPage() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [owner, setOwner] = useState(null); // For storing the owner's username
  const { event_id } = useParams();

  useEffect(() => {
    // fetches event details using event_id
    fetch(`http://9.223.200.206:80/api/event/${event_id}`)
      .then(response => {
        if (!response.ok) throw new Error('Event not found');
        return response.json();
      })
      .then(data => {
        // processes the evnts start and end times
        const startDateTime = dayjs(`${data.startDate}T${data.startTime}`);
        const endDateTime = dayjs(`${data.endDate}T${data.endTime}`);
        setEvent({ ...data, startDateTime, endDateTime });

        // Fetch the owner's username by their userId (from the `owner` field)
        return fetch(`http://9.223.200.206:80/api/user/${data.owner}`);
      })
      .then(response => {
        if (!response.ok) throw new Error('User not found');
        return response.json();
      })
      .then(userData => {
        setOwner(userData.user.username); // Set the owner's username
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [event_id]);

  if (loading) return <div>Loading event details...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="30rem"
      sx={{ backgroundColor: 'var(--clr-background-mid)', padding: 4 }}
    >
      {event && (
        <Card sx={{ maxWidth: 900, boxShadow: 4, borderRadius: 3, bgcolor: 'var(--clr-background-dark)' }}>
          <CardContent>

            {/* Displaying event title */}
            <Typography
              variant="h3"
              gutterBottom
              color="primary"
              sx={{ fontWeight: 'bold', textAlign: 'center', marginBottom: 3 }}
            >
              {event.title || 'Untitled Event'}
            </Typography>

            <Divider sx={{ marginY: 3 }} />

            <Stack direction="row" spacing={2} alignItems="center">
              <EventIcon color="primary" />
              <Typography variant="h5" color="textSecondary">
                {event.singleDay ? 'Event Date & Time' : 'Event Dates & Times'}
              </Typography>
            </Stack>

            <Box sx={{ textAlign: 'center', marginBottom: 3 }}>

              {/* Displaying event dates and times, different if single day or not */}
              {event.singleDay ? (
                <>
                  <Typography variant="body1" gutterBottom sx={{ fontSize: '1.3rem', fontWeight: 500 }}>
                    {dayjs(event.startDate).format('dddd MMMM D YYYY')}
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontSize: '1.3rem', fontWeight: 500 }}>
                    <AccessTimeIcon sx={{ verticalAlign: 'middle', marginRight: 1 }} />
                    {dayjs(event.startDateTime).format('HH:mm')} - {dayjs(event.endDateTime).format('HH:mm')}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" gutterBottom sx={{ fontSize: '1.3rem', fontWeight: 500 }}>
                  {dayjs(event.startDateTime).format('dddd MMMM D YYYY HH:mm')} -{' '}
                  {dayjs(event.endDateTime).format('dddd MMMM D YYYY HH:mm')}
                </Typography>
              )}
            </Box>

            <Divider sx={{ marginY: 3 }} />

            {/* Displaying event description */}
            <Stack direction="row" spacing={2} alignItems="center">
              <DescriptionIcon color="primary" />
              <Typography variant="h5" color="textSecondary">
                Description
              </Typography>
            </Stack>

            <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '1.3rem', marginBottom: 3 }}>
              {event.description || 'No description available.'}
            </Typography>

            <Divider sx={{ marginY: 3 }} />

            {/* Displaying event owner */}
            <Stack direction="row" spacing={2} alignItems="center">
              <PersonIcon color="primary" />
              <Typography variant="h5" color="textSecondary">
                Event Owner
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ fontSize: '1.3rem', fontWeight: 500 }}>
              {owner ? owner : 'Unknown owner'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default EventPage;
