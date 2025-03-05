import * as React from 'react';
import Grid2 from '@mui/material/Grid2';
import { Avatar, Button, Checkbox, FormControlLabel, IconButton, Link, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import '../App.css';

const RegistrationPage = () => {

    const paperStyle = { padding: 20, height: '90vh', width: 300, margin: "20px auto" };
    const avatarStyle = { backgroundColor: '--clr-background-bright' };
    const btnStyle = { backgroundColor: '--clr-background-bright', margin: '12px 0' };
    const [loading, setLoading] = React.useState(false);
    const IP_ADDRESS = 'http://9.223.136.195';
    axios.defaults.withCredentials = true;

    // Form state
    const [form, setForm] = React.useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });

    // Error state
    const [errors, setErrors] = React.useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        acceptTerms: ''
    });

    // Password visibility toggle state
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const navigate = useNavigate();

    // Real-time form validation
    const validateForm = () => {
        let tempErrors = { ...errors };

        // Email validation
        if (!form.email) {
            tempErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            tempErrors.email = 'Email is not valid.';
        } else {
            tempErrors.email = '';
        }

        // Username validation
        if (!form.username) {
            tempErrors.username = 'Username is required.';
        } else if (form.username.length < 3) {
            tempErrors.username = 'Username must be at least 3 characters long.';
        } else {
            tempErrors.username = '';
        }

        // Password validation
        if (!form.password) {
            tempErrors.password = 'Password is required.';
        } else if (form.password.length < 6) {
            tempErrors.password = 'Password must be at least 6 characters long.';
        } else {
            tempErrors.password = '';
        }

        // Confirm Password validation
        if (!form.confirmPassword) {
            tempErrors.confirmPassword = 'Please confirm your password.';
        } else if (form.confirmPassword !== form.password) {
            tempErrors.confirmPassword = 'Passwords do not match.';
        } else {
            tempErrors.confirmPassword = '';
        }

        // Terms of Service validation
        if (!form.acceptTerms) {
            tempErrors.acceptTerms = 'You must accept the Terms of Service.';
        } else {
            tempErrors.acceptTerms = '';
        }

        setErrors(tempErrors);

        // Check if there are no errors
        return Object.values(tempErrors).every(error => error === '');
    };

    // Handle form changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission
    const handleRegisterClick = async () => {
        if (validateForm()) {
            setLoading(true);
    
            try {
                // Make POST request to the backend
                const response = await axios.post(`${IP_ADDRESS}/user/register`, {
                    email: form.email,
                    username: form.username,
                    password: form.password
                });
    
                // Handle success
                console.log('User registered:', response.data);
                setLoading(false);
                navigate('/');
            } catch (error) {
                // Handle error
                console.error('Registration failed:', error.response.data);
                setLoading(false);
    
                // Check for specific error messages
                if (error.response.data.message === 'Email is already taken.') {
                    setErrors(prevErrors => ({ ...prevErrors, email: 'Email is already taken.' }));
                } else if (error.response.data.message === 'Username is already taken.') {
                    setErrors(prevErrors => ({ ...prevErrors, username: 'Username is already taken.' }));
                } else {
                    // Handle generic registration error
                    setErrors(prevErrors => ({ ...prevErrors, general: 'Registration failed. Please try again.' }));
                }
            }
        }
    };


    const handleTOSClick = () => {
        navigate('/Terms-of-Service');
    };

    return (
        <div className='LoginForm'>
            <Grid2 container spacing={2} justifyContent="center">
                <Grid2 style={paperStyle}>
                    <Grid2 align='center'>
                        <Avatar style={avatarStyle}>
                            <AccountCircleIcon style={{ color: '--clr-background-mid' }} />
                        </Avatar>
                        <h2>Register</h2>
                    </Grid2>

                    {/* Email Field */}
                    <TextField
                        name="email"
                        label="Email"
                        variant="standard"
                        placeholder="Enter Your Email"
                        fullWidth
                        required
                        value={form.email}
                        onChange={handleChange}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                    />

                    {/* Username Field */}
                    <TextField
                        name="username"
                        label="Username"
                        variant="standard"
                        placeholder="Enter Your Username"
                        fullWidth
                        required
                        value={form.username}
                        onChange={handleChange}
                        error={Boolean(errors.username)}
                        helperText={errors.username}
                    />

                    {/* Password Field */}
                    <TextField
                        name="password"
                        type={showPassword ? "text" : "password"}
                        label="Password"
                        variant="standard"
                        placeholder="Enter Your Password"
                        fullWidth
                        required
                        value={form.password}
                        onChange={handleChange}
                        error={Boolean(errors.password)}
                        helperText={errors.password}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            )
                        }}
                    />

                    {/* Confirm Password Field */}
                    <TextField
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        label="Confirm Password"
                        variant="standard"
                        placeholder="Confirm Your Password"
                        fullWidth
                        required
                        value={form.confirmPassword}
                        onChange={handleChange}
                        error={Boolean(errors.confirmPassword)}
                        helperText={errors.confirmPassword}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            )
                        }}
                    />

                    {/* Terms of Service Checkbox */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="acceptTerms"
                                color="primary"
                                checked={form.acceptTerms}
                                onChange={handleChange}
                            />
                        }
                        label= {
                            <span onClick={handleTOSClick} style={{cursor: 'pointer'}}>
                                I accept the <Link to="/Terms-of-Service">Terms of Service</Link>
                            </span>
                        }
                        
                        
                    />
                    {errors.acceptTerms && (
                        <Typography color="error" variant="body2">
                            {errors.acceptTerms}
                        </Typography>
                    )}

                    {/* Register Button */}
                    <Button
                        style={btnStyle}
                        type="submit"
                        color="primary"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        onClick={handleRegisterClick}
                    >
                        {loading ? "Registering..." : "Register"}
                    </Button>

                    {/* Already have an account? */}
                    <Typography>
                        Already have an account?
                        <div>
                            <Link component={RouterLink} to="/login" color="primary">
                                Login Here
                            </Link>
                        </div>
                    </Typography>
                </Grid2>
            </Grid2>
        </div>
    );
};

export default RegistrationPage;