import { createTheme } from '@mui/material/styles'

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ab55',
      dark: '#007b55',
      light: '#5be584',
    },
    secondary: {
      main: '#3366ff',
      dark: '#1939b7',
      light: '#84a9ff',
    },
    background: {
      default: '#161c24',
      paper: '#212b36',
    },
    text: {
      secondary: '#919eab',
      disabled: '#637381',
    },
    error: {
      main: '#ff4842',
      light: '#ffa48d',
      dark: '#b72136',
    },
    warning: {
      main: '#ffc107',
      light: '#ffe16a',
      dark: '#b78103',
    },
    info: {
      main: '#1890ff',
      dark: '#0c53b7',
      light: '#74caff',
    },
    success: {
      main: '#54d62c',
      light: '#aaf27f',
      dark: '#229a16',
      contrastText: '#212b36',
    },
  },
})
