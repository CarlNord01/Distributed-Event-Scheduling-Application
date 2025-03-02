export const findSession = async () => {
    try {
        const response = await fetch(`http://9.223.200.206:5001/api/session`, {
            method: 'GET',
            credentials: 'include',
        });

        if (response.status === 200) {
            /* Session found */
            const data = await response.json();
            return data;
        }
        else {
          throw new Error(`Session not found: ${response.status}`);
        }

    } catch (error) {
        console.error(error);
    }
};

export const userLogin = async (username, password) => {
    try {
        const response = await fetch(`http://9.223.200.206:5001/api/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            /* Login successful */
            const data = await response.json();
            return data;
        }
        else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

    } catch (error) {
        console.error(error);
    }
};
