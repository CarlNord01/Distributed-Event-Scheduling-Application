import React, { useState, useEffect } from 'react';
import { TextField, Grid, Box } from '@mui/material';
import FriendCard from './Friends/FriendCard';

function UserList() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // State to store the search input from the user
    const [filteredUser, setFilteredUser] = useState([]); // State for the filtered list of users based on the search query
    // eslint-disable-next-line
    const [user, setUser] = useState([]);
    const [tempFilteredUser, setTempFilteredUser] = useState([]); // Temporary state to store the unfiltered user list

    useEffect(() => {
        const fetchData = async () => {
            try {
                // fatches all users from the database (only _id and usernames)
                const response = await fetch('http://localhost/api/users', { credentials: 'include' });
                const data = await response.json();
                setUser(data); // Stores the full list of users
                setTempFilteredUser(data); // Initializes the filtered list with the unfiltered user data
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // handles search input changes
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value); // Update the searchQuery
    };

    // filter users based on the searchquery
    useEffect(() => {
        const searchFilteredUser = tempFilteredUser.filter((user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUser(searchFilteredUser); // Update the filteredUser state with the filtered results
    }, [searchQuery, tempFilteredUser]);

    if (loading) return <div>Loading users...</div>;
    if (error) return <div>Error fetching users: {error.message}</div>;

    return (
        <div>
            {/* Search Input */}
            <Box display="flex" justifyContent="space-between" mb={3}>
                <TextField
                    label="Search by Username"
                    variant="outlined"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    fullWidth
                    style={{ marginRight: '16px' }}
                />
            </Box>

            {/* Display users */}
            <Grid container spacing={1} justifyContent="center">
                {filteredUser.map((user) => (
                    <Grid item xs={12} sm={6} md={4} lg={4} key={user._id}>
                        <FriendCard
                            name={user.username}
                            id={user._id}
                        />
                    </Grid>
                ))}
            </Grid>
        </div>
    );
}

export default UserList;