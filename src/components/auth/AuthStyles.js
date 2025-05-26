import { styled } from '@mui/material/styles';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';

export const AuthContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.default,
}));

export const AuthPaper = styled(Paper)(({ theme }) => ({
  maxWidth: 450,
  width: '100%',
  padding: theme.spacing(5, 4),
  boxShadow: theme.shadows[4],
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3.5),
  margin: theme.spacing(2),
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

export const AuthForm = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5), // Slightly reduced gap between form fields
  width: '100%',
}));

export const AuthInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1), // Gap between label and input
}));

export const AuthTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(1),
  fontWeight: 700,
  fontSize: '1.75rem',
  color: theme.palette.primary.main,
  letterSpacing: '-0.5px',
  lineHeight: 1.2,
}));

export const AuthTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    fontSize: '0.95rem',
    '& fieldset': {
      borderWidth: '1.5px',
      transition: 'border-color 0.2s',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.95rem',
  },
  '& .MuiOutlinedInput-root:hover': {
    '& fieldset': {
      borderColor: theme.palette.primary.light,
    },
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    '& fieldset': {
      borderWidth: '1.5px',
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: theme.spacing(0.5),
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

export const AuthButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1.5, 4),
  marginTop: theme.spacing(1),
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  letterSpacing: '0.5px',
  backgroundColor: theme.palette.primary.main,
  boxShadow: 'none',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: theme.shadows[2],
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

export const AuthAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 8,
  marginBottom: theme.spacing(2),
}));

export const AuthLink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontWeight: 500,
  '&:hover': {
    textDecoration: 'underline',
  },
}));
