import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Paper, Typography, Grid, Button, Switch, Card, CardContent, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import theme from './theme';

const UIProvider = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default UIProvider;
export { Box, Paper, Typography, Grid, Button, Switch, Card, CardContent, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
