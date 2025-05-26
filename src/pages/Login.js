import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Alert } from '@mui/material';
import UIProvider from '../components/ui';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  return (
    <UIProvider>
      <LoginForm />
    </UIProvider>
  );
}
