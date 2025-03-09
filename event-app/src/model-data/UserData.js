import axios from 'axios';
const IP_ADDRESS = 'http://9.223.136.195';

export const findSession = async () => {
  try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${IP_ADDRESS}/user/session/${token}`,{
          withCredentials: true
      });

      console.log("Session data:", response.data);
  } catch (error) {
      console.error("Error fetching session:", error);
  }
};

export const userLogin = async (username, password) => {
    try {
      const response = await axios.post(
        `${IP_ADDRESS}/user/login`,
        { username, password }, // Request body
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true, //  Equivalent of credentials: 'include'
        }
      );
  
      // Axios automatically handles JSON parsing and status codes 2xx as successful.
      if (response.status >= 200 && response.status < 300) {  //Explicit check for success status codes.
          // Store the token in localStorage
          localStorage.setItem('authToken', response.data.token);
          return response.data; // Axios already parsed the JSON
      } else {
          //This part will probably not be reached, but is put here to be symantically similar to the original function
          throw new Error(`HTTP error! status: ${response.status}`);
      }
  
    } catch (error) {
      // Axios wraps network errors and errors from non-2xx responses.
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Server responded with an error:", error.response.status, error.response.data);
        throw new Error(`HTTP error! status: ${error.response.status}`); //Consistent error throwing
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        throw new Error("No response received from server.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message);
        throw new Error(error.message);  // Or a more specific error message
      }
    }
  };
