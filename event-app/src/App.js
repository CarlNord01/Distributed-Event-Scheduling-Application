import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { createTheme, ThemeProvider, Avatar, IconButton, Button, ButtonGroup } from '@mui/material';
import HomePage from './routes/HomePage';
import PublicEvents from './routes/PublicEvents';
import LoginPage from './routes/LoginPage';
import RegisterPage from './routes/RegisterPage';
import EventPage from './routes/EventPage';
import CreateEventPage from './routes/CreateEventPage';
import axios from 'axios';
import FriendPage from './routes/FriendPage';
import stringToColor from './components/StringToColor.js';
import Drawer from './components/Drawer.js';

const darkTheme = createTheme({
  components: {
    MuiButtonGroup: {
      styleOverrides: {
        grouped: {
          '&:not(:last-of-type)': {
            borderRightColor: 'white' // Changes the divider color for variant=text ButtonGroup buttons
          }
        }
      }
    }
  },
  palette: {
    mode: 'dark',
  }
});

function App() {
  axios.defaults.withCredentials = true;
  const [user, setUser] = useState(null); // Store user data
  const [drawerOpen, setDrawerOpen] = useState(null); // For the dropdown menu

  // Check local storage for user information on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Handle avatar click to open the drawer
  const handleAvatarClick = () => {
    setDrawerOpen(true);
    checkSession();
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    handleDrawerClose();
    checkSession();
    window.location.href = '/login'; // Redirect to login page
  };
  
  const checkSession = async () => {
    try {
        const response = await axios.get('http://localhost:5001/api/session');
        if (response.data.user) {
            console.log('Active session found:', response.data.user);
        }
    } catch (error) {
        console.log('No active session');
    }
};

  return (
    <ThemeProvider theme={darkTheme}> {/* Sets the theme of all MUI components to dark*/}
      <BrowserRouter>
        <div className="App">
          <header className="Header">
            <div className='header-title'>
              <Link to='/' className='btn'>
                <img className='navbar_logo' src="/icon.png" alt="ESP logo" />
              </Link>
            </div>
            <nav className='nav'>
              {user ? (
                <>
                {/* The user is logged in */}
                <ButtonGroup 
                    variant="text" 
                    aria-label='Navigation buttons'  
                >
                    <Button>
                      <Link to="/events">Events</Link>
                    </Button>
                    <Button>
                      <Link to="/events/create-new-event">Create</Link>
                    </Button>
                    <Button>
                      <Link to="/friends">Friends</Link>
                    </Button>
                </ButtonGroup>
                </>
              ) : (
                <>
                  {/* The user is not logged in */}
                  <ButtonGroup 
                      variant="text" 
                      aria-label='Navigation buttons'
                  >
                      <Button>
                        <Link to="/events">Events</Link>
                      </Button>
                  </ButtonGroup>
                </>
              )}

            </nav>
            <div className='Login'>
              {/* If the user is logged in, show the avatar instead of login/register */}
              {user ? (
                <>
                  <IconButton onClick={handleAvatarClick}>
                    <Avatar sx={{ bgcolor: stringToColor(user.username)}} >{user.username[0].toUpperCase()}</Avatar>
                  </IconButton>
                  {/* Use Drawer instead of Menu */}
                  <Drawer
                    open={drawerOpen}
                    onClose={handleDrawerClose}
                    handleLogout={handleLogout}
                  />
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button sx={{marginRight: '1rem'}} variant='contained'>
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant='outlined'>
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </header>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<PublicEvents />} />
            <Route path="/login" element={<LoginPage onLogin={setUser} />} /> {/* Pass setUser as onLogin */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/event/:event_id" element={<EventPage />} />
            <Route path="/events/create-new-event" element={<CreateEventPage />} />
            <Route path="/friends" element={<FriendPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;