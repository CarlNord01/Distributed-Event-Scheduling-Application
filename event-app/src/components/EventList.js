import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Grid, Button, Box, MenuItem } from '@mui/material';
import DatePicker from './DatePicker';
import EventCard from './EventCard';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import CustomCheckbox from './Checkbox';
import CustomSnackbar from './CustomSnackbar';
import axios from 'axios';
import { getUserFriends } from './../model-data/FriendData';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function EventList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [tempFilteredEvents, setTempFilteredEvents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [singleDay, setSingleDay] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarTriggered, setSnackbarTriggered] = useState(false);
  const [publicEvents, setPublicEvents] = useState([]);
  const [privateEvents, setPrivateEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [userId, setUserId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [showFriendsEvents, setShowFriendsEvents] = useState(false);
  const [eventVisibilityFilter, setEventVisibilityFilter] = useState('all');

  useEffect(() => {
    const fetchUserId = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/session', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sessionData = await response.json();
            setUserId(sessionData.user?.userId || null);
        } catch (error) {
            console.error('Error fetching user session:', error);
            setUserId(null); // Ensure that we explicitly set this to null in case of an error
        } finally {
            setLoading(false);
        }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const publicEventsResponse = await fetch('http://localhost:5001/api/events/public', {
          credentials: 'include',
        });
        if (!publicEventsResponse.ok) {
          throw new Error(`HTTP error! status: ${publicEventsResponse.status}`);
        }
        const publicEventsData = await publicEventsResponse.json();
        setPublicEvents(publicEventsData);
        setAllEvents(publicEventsData); // If logged out, we only set public events
        setFilteredEvents(publicEventsData);
        setTempFilteredEvents(publicEventsData);
      } catch (error) {
        console.error('Error fetching public events:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    if (!userId) {
      // If no userId, fetch only public events
      fetchPublicEvents();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchFriendsAndEvents = async () => {
      setLoading(true);
      try {
        // Fetch friends
        const fetchedFriends = await getUserFriends();
        setFriends(fetchedFriends);

        // Fetch private events for each friend
        const allPrivateEvents = [];
        await Promise.all(
          fetchedFriends.map(async (request) => {
            try {
              const userResponse = await fetch(
                `http://localhost:5001/api/user/${request.id}/private-events`,
                { credentials: 'include' }
              );
              if (!userResponse.ok) {
                throw new Error(`HTTP error! status: ${userResponse.status}`);
              }
              const userData = await userResponse.json();
              allPrivateEvents.push(...userData);
            } catch (error) {
              console.error('Error fetching private events:', error);
            }
          })
        );
        setPrivateEvents(allPrivateEvents);

        // Fetch current user's private events
        const userEventsResponse = await fetch(
          `http://localhost:5001/api/user/${userId}/private-events`,
          { credentials: 'include' }
        );
        if (!userEventsResponse.ok) {
          throw new Error(`HTTP error! status: ${userEventsResponse.status}`);
        }
        const userEventsData = await userEventsResponse.json();
        setUserEvents(userEventsData);

        // Combine all events (private, public, and user-specific)
        const combinedEvents = [
          ...allPrivateEvents,
          ...publicEvents,
          ...userEventsData,
        ];
        setAllEvents(combinedEvents); // Set the combined events in state
        setFilteredEvents(combinedEvents);
        setTempFilteredEvents(combinedEvents);
      } catch (error) {
        console.error('Error fetching friends or events:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsAndEvents();
  }, [userId, publicEvents]);

  const validateEndDate = useCallback(() => {
    if (startDate && endDate) {
      if (dayjs(endDate).isBefore(dayjs(startDate))) {
        setEndDate(null);
        setSnackbarTriggered(true);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (snackbarTriggered) {
      setShowSnackbar(true);
      setTimeout(() => {
        setShowSnackbar(false);
        setSnackbarTriggered(false);
      }, 5000);
    }
  }, [snackbarTriggered]);

  useEffect(() => {
    validateEndDate();
  }, [startDate, endDate, validateEndDate]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
    setSingleDay(false);
    setEventTypeFilter('all');
    setFilteredEvents(allEvents);
    setTempFilteredEvents(allEvents);
    setEventVisibilityFilter('all');
    setShowFriendsEvents(false);
  };

  const handleStartDateChange = (newValue) => {
    if (newValue === null) {
      setStartDate(null);
    } else {
      const validStartDate = dayjs(newValue);
      setStartDate(validStartDate);
      if (singleDay) {
        setEndDate(dayjs(validStartDate).endOf('day'));
      } else {
        validateEndDate();
      }
    }
  };

  const handleEndDateChange = (newValue) => {
    if (newValue === null) {
      setEndDate(null);
    } else {
      const validEndDate = dayjs(newValue);
      setEndDate(validEndDate);
      validateEndDate();
    }
  };

  const handleFriendsEventsChange = (event) => {
    setShowFriendsEvents(event.target.checked);
  };

  const applyFilters = useCallback(() => {
    let filtered = allEvents;

    if (startDate || endDate) {
      filtered = filtered.filter((event) => {
        const eventStart = dayjs(event.startDate).startOf('day');
        const eventEnd = dayjs(event.endDate).endOf('day');

        if (singleDay && startDate) {
          return dayjs(startDate).isBetween(eventStart, eventEnd, null, '[]');
        }

        const matchesStartDate = startDate
          ? eventStart.isSameOrAfter(dayjs(startDate).startOf('day'))
          : true;
        const matchesEndDate = endDate
          ? eventEnd.isSameOrBefore(dayjs(endDate).endOf('day'))
          : true;

        return matchesStartDate && matchesEndDate;
      });
    }

    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter((event) => {
        if (eventTypeFilter === 'single') return event.singleDay;
        if (eventTypeFilter === 'multi') return !event.singleDay;
        return true;
      });
    }

    // Filter by event visibility
    if (eventVisibilityFilter !== 'all') {
      filtered = filtered.filter((event) => {
        if (eventVisibilityFilter === 'public') return !event.privateEvent; // Assuming `event.private` indicates if the event is private
        if (eventVisibilityFilter === 'private') return event.privateEvent;
        return true;
      });
    }

    // Filter by friends' events if checkbox is checked
    if (showFriendsEvents && userId && friends.length > 0) {
      filtered = filtered.filter((event) =>
        friends.some((friend) => friend.id.toString() === event.owner)
      );
    }

    setTempFilteredEvents(filtered);
  }, [startDate, endDate, allEvents, eventTypeFilter, singleDay, showFriendsEvents, friends, userId, eventVisibilityFilter]);

  useEffect(() => {
    const searchFilteredEvents = tempFilteredEvents.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(searchFilteredEvents);
  }, [searchQuery, tempFilteredEvents]);

  const toggleFilterSection = () => {
    setShowFilters(!showFilters);
  };

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error fetching events: {error.message}</div>;

  return (
    <div>
      {/* Search Input */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <TextField
          label="Search by Title"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          style={{ marginRight: '16px' }}
        />
        <Button variant="outlined" onClick={toggleFilterSection}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      {/* Conditional rendering of the filter section */}
      {showFilters && (
        <Box mb={3}>
          
          <Box display="flex" justifyContent="center" mb={2}>
            {/* Event Type Filter */}
            <TextField
              select
              label="Event Type"
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value)}
              variant="outlined"
              style={{ width: '200px', marginRight: '8px' }}
            >
              <MenuItem value="all">All Events</MenuItem>
              <MenuItem value="single">Single Day Events</MenuItem>
              <MenuItem value="multi">Multi-Day Events</MenuItem>
            </TextField>

            {userId && (
              <>
                {/* Event Visibility Filter */}
                <TextField
                  select
                  label="Event Visibility"
                  value={eventVisibilityFilter}
                  onChange={(event) => setEventVisibilityFilter(event.target.value)}
                  variant="outlined"
                  style={{ width: '200px', marginRight: '8px' }}
                >
                  <MenuItem value="all">All Events</MenuItem>
                  <MenuItem value="public">Public Events</MenuItem>
                  <MenuItem value="private">Private Events</MenuItem>
                </TextField>

                {/* Show Friends Events Checkbox */}
                <CustomCheckbox
                  label="Show Friends Events"
                  checked={showFriendsEvents}
                  onChange={handleFriendsEventsChange}
                  ml={2} // Add margin left to the checkbox
                />
              </>
            )}
          </Box>
          
          <Box display="flex" justifyContent="center" mb={1}>
            <Box display="flex" ml={-2} justifyContent="space-between" width="45%">
              <DatePicker
                label={singleDay ? 'Date' : 'Start Date'}
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} />}
                style={{ marginRight: '8px' }}
                clearable
              />
              {!singleDay && (
                <>
                  <Box mr={2} />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    renderInput={(params) => <TextField {...params} />}
                    clearable
                  />
                </>
              )}
            </Box>
            <CustomCheckbox
              label="Single Day Event"
              checked={singleDay}
              onChange={(event) => {
                const isChecked = event.target.checked;
                setSingleDay(isChecked);
                if (isChecked) {
                  setStartDate(null);
                  setEndDate(null);
                } else {
                  setEndDate(null);
                }
              }}
            />
          </Box>
          <Box display="flex" justifyContent="center" mt={1}>
            <Button variant="contained" onClick={applyFilters} style={{ marginRight: '16px' }}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </Box>
        </Box>
      )}

      {/* Display Events */}
      <Grid container spacing={1} justifyContent="center">
        {filteredEvents.map((event) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={event._id}>
            <EventCard
              title={event.title}
              startDate={event.startDate}
              endDate={event.endDate}
              startTime={event.startTime || '00:00'}
              endTime={event.endTime || '23:59'}
              description={event.description}
              singleDay={event.singleDay}
              id={event._id}
            />
          </Grid>
        ))}
      </Grid>

      {/* Snackbar for end date error */}
      {showSnackbar && (
        <CustomSnackbar
          open={showSnackbar}
          onClose={() => setShowSnackbar(false)}
          message="End date cannot be before start date"
        />
      )}
    </div>
  );
}

export default EventList;