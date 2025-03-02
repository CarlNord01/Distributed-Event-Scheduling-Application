
export const getLatestEvents = async () => {
    try {
      const response = await fetch(`http://9.223.200.206/api/events/latest`, {
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
