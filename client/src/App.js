import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import RepositoriesPage from './pages/RepositoriesPage';
import AnalysisPage from './pages/AnalysisPage';
import AnalysisDetailPage from './pages/AnalysisDetailPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';

// Styles
import './App.css';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div>Loading...</div>
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Main Layout component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for navbar height
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: (theme) => theme.palette.background.default
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Theme configuration
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#c51162',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [themeMode, setThemeMode] = React.useState('light');
  const theme = React.useMemo(() => createAppTheme(themeMode), [themeMode]);

  React.useEffect(() => {
    // Get theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setThemeMode(savedTheme);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CustomThemeProvider value={{ themeMode, toggleTheme }}>
          <CssBaseline />
          <AuthProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <DashboardPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/repositories"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <RepositoriesPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analysis"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <AnalysisPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analysis/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <AnalysisDetailPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SettingsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Redirect unknown routes */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              </div>
            </Router>
          </AuthProvider>
        </CustomThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;