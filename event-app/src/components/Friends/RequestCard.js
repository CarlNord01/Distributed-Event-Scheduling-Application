import * as React from 'react';
import { Link } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import { Avatar, Button, Stack } from '@mui/material';
import Divider from '@mui/material/Divider';
import stringToColor from '../StringToColor.js';

function RequestCard({ name, id, onAccept, onDecline }) {

    const handleAccept = async () => {
        try {
            const response = await fetch(`http://9.223.106.132:80/api/friend-request/accept/${id}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error accepting friend request: ${response.status}`);
            }

            onAccept(id); // Call parent function to update UI
        } catch (error) {
            console.error(error);
        }
    };

    const handleDecline = async () => {
        try {
            const response = await fetch(`http://9.223.106.132:80/api/friend-request/decline/${id}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error declining friend request: ${response.status}`);
            }

            onDecline(id); // Call parent function to update UI
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card sx={{ width: 425, display: 'flex', marginBottom: '1rem' }}>
            <Link to={`/profile/${id}`} sx={{ width: '100%' }}>
                <CardActionArea>
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        <Stack direction={"row"} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ marginRight: 2, bgcolor: stringToColor(name) }}>
                                {name[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="h6" sx={{
                                width: 175,
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {name}
                            </Typography>
                        </Stack>
                        <Divider orientation='vertical' sx={{ p: 1 }} />
                        <Stack direction="row" sx={{ p: 1, width: 150 }}>
                            <Button onClick={handleAccept}>Accept</Button>
                            <Button onClick={handleDecline}>Deny</Button>
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Link>
        </Card>
    );
}

export default RequestCard;
