import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to {{projectName}}
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          A modern fullstack application built with Spring Boot and React
        </Typography>
        
        {!user && (
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="primary"
              size="large"
            >
              Login
            </Button>
          </Box>
        )}

        {user && (
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/dashboard"
              variant="contained"
              color="primary"
              size="large"
            >
              Go to Dashboard
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Home; 