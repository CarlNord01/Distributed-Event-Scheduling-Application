import * as React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import Diversity1Icon from '@mui/icons-material/Diversity1';

export default function ProfileDrawer({ open, onClose, handleLogout }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null); // State to store userId
  const IP_ADDRESS = 'http://9.223.136.195';

  // Fetch the logged-in user's information when the component mounts
  useEffect(() => {
    axios
      .get(`${IP_ADDRESS}/user/session`, { withCredentials: true })
      .then((response) => {
        if (response.data.user) {
          setUserId(response.data.user.userId); // Set the userId state
        } else {
          console.error('No user data found in session response');
        }
      })
      .catch((error) => {
        console.error('Error fetching user session data:', error);
      });
  }, []);

  const handleNavigateToFriends = () => {
    navigate('/friends');
    onClose();
  };

  const handleNavigateToProfile = () => {
    if (userId) {
      navigate(`/profile/${userId}`); // Navigate to the user's profile using userId
      onClose();
    } else {
      console.error('User ID is not available');
    }
  };

  const handleNavigateToUsers = () => {
    navigate('/users');
    onClose();
  };

  const list = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={onClose}
      onKeyDown={onClose}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleNavigateToProfile}>
            <ListItemIcon>  
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={handleNavigateToFriends}>
            <ListItemIcon>
              <Diversity1Icon />
            </ListItemIcon>
            <ListItemText primary="Friends" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={handleNavigateToUsers}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Users" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      {list()}
    </Drawer>
  );
}
