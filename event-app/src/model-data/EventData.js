const IP_ADDRESS = 'http://9.223.136.195';
export const getLatestEvents = async () => {
    try {
      const response = await fetch(`${IP_ADDRESS}/events/latest`, {
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Latest event data:', data);
      
      return data;
  
    } catch (error) {
      console.error('Error fetching latest event data:', error);
      return error; 
    }
  };
