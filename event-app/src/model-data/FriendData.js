import axios from 'axios';
const IP_ADDRESS = 'http://9.223.136.195';

export const sendFriendRequest = async (targetUserId) => {
    try {
      // Make POST request to backend
      axios.post(`${IP_ADDRESS}/friends/request/${targetUserId}`, { withCredentials: true })
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
  export const killFriend = async (victimId) => {
    try {
        const response = await fetch(`${IP_ADDRESS}/friends/remove/${victimId}`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error(error);
    }
};

  export const getUserFriends = async () => {
    try {
      const response = await fetch(`${IP_ADDRESS}/friends/list`, {
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Assuming /api/friends now returns an array of { _id, username }
      const friendsWithUsernames = data.map(friend => ({
        id: friend._id, 
        username: friend.username
      }));
      
      return friendsWithUsernames;
  
    } catch (error) {
      console.error('Error fetching friends:', error);
      return error; 
    }
  };

  export const checkFriend = async (userId) => {
    try {
      const response = await fetch(`${IP_ADDRESS}/friends/checkfriend/${userId}`, {
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("is friend: ", data);

      if (data){
        return true;
      } else {
        return false;
      }

    } catch (error) {
      console.error('Error checking friend status:', error);
      return error; 
    }
  };

  export const checkPendingRequest = async (userId) => {
    try {
      const response = await fetch(`${IP_ADDRESS}/friends/checkfriend/request/${userId}`, {
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("request: ", data);

      if (data){
        return true;
      } else {
        return false;
      }

    } catch (error) {
      console.error('Error checking friend status:', error);
      return error; 
    }
  };
