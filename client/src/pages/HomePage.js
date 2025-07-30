import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  GitHub as GitHubIcon,
  BugReport as BugIcon,
  Assessment as AssessmentIcon,
  AutoFixHigh as AutoFixIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

const FeatureCard = ({ icon, title, description, delay = 0 }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {React.cloneElement(icon, {
              sx: {
                fontSize: 48,
                color: theme.palette.primary.main,
              },
            })}
          </Box>
          <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatCard = ({ value, label, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <Box textAlign="center">
        <Typography variant="h3" component="div" fontWeight={700} color="primary.main">
          {value}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </motion.div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { themeMode, toggleTheme } = useCustomTheme();

  const features = [
    {
      icon: <CodeIcon />,
      title: 'Multi-Language Support',
      description: 'Analyze JavaScript, TypeScript, Python, Java, Go, Rust, and C++ code with advanced AST parsing.',
    },
    {
      icon: <SecurityIcon />,
      title: 'Security Analysis',
      description: 'Detect security vulnerabilities, code injection risks, and follow security best practices.',
    },
    {
      icon: <SpeedIcon />,
      title: 'Performance Insights',
      description: 'Identify performance bottlenecks, optimize algorithms, and improve code efficiency.',
    },
    {
      icon: <BugIcon />,
      title: 'Bug Detection',
      description: 'Find potential bugs, unreachable code, and logical errors before they reach production.',
    },
    {
      icon: <GitHubIcon />,
      title: 'GitHub Integration',
      description: 'Seamlessly integrate with GitHub repositories, webhooks, and pull request reviews.',
    },
    {
      icon: <AssessmentIcon />,
      title: 'Detailed Reports',
      description: 'Get comprehensive analysis reports with metrics, trends, and actionable insights.',
    },
  ];

  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#'
  ];

  return (
    <Box>
      {/* Navigation */}
      <AppBar position="fixed" sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Box display="flex" alignItems="center" flexGrow={1}>
            <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="div" fontWeight={700}>
              AI Code Review
            </Typography>
          </Box>
          <IconButton onClick={toggleTheme} sx={{ mr: 2 }}>
            {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Button
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          pt: 12,
          pb: 8,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 3,
                  }}
                >
                  AI-Powered{' '}
                  <span style={{ color: theme.palette.primary.main }}>
                    Code Review
                  </span>{' '}
                  Assistant
                </Typography>
                <Typography
                  variant="h5"
                  component="p"
                  color="text.secondary"
                  sx={{ mb: 4, lineHeight: 1.6 }}
                >
                  Analyze code quality, detect bugs, and get AI-powered suggestions
                  for better, more secure code across multiple programming languages.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Start Free Analysis
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<GitHubIcon />}
                    onClick={() => navigate('/login')}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Connect GitHub
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {languages.map((lang, index) => (
                    <motion.div
                      key={lang}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Chip
                        label={lang}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.9),
                    borderRadius: 3,
                    p: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Live Code Analysis
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      p: 2,
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <code>
{`// Security vulnerability detected
function processInput(userInput) {
  eval(userInput); // ⚠️ Dangerous eval() usage
}

// Performance issue found
for (let i = 0; i < array.length; i++) {
  for (let j = 0; j < array.length; j++) {
    // 💡 Consider optimization
  }
}`}
                    </code>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip
                      label="2 Security Issues"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="1 Performance Warning"
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={6} md={3}>
            <StatCard value="100K+" label="Lines Analyzed" delay={0.1} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard value="500+" label="Bugs Found" delay={0.2} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard value="8" label="Languages Supported" delay={0.3} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard value="99.9%" label="Accuracy Rate" delay={0.4} />
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h2"
              component="h2"
              textAlign="center"
              gutterBottom
              fontWeight={700}
            >
              Powerful Features
            </Typography>
            <Typography
              variant="h6"
              component="p"
              textAlign="center"
              color="text.secondary"
              sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
            >
              Everything you need to maintain high-quality, secure, and performant code
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={feature.title}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 0.1}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="md" textAlign="center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <AutoFixIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
            <Typography variant="h3" component="h2" gutterBottom fontWeight={700}>
              Ready to Improve Your Code?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of developers who trust AI Code Review Assistant
              to maintain high-quality codebases.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.9),
                },
              }}
              onClick={() => navigate('/register')}
            >
              Get Started for Free
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'background.paper', py: 4, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>
                  AI Code Review Assistant
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Making code review intelligent and efficient.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} textAlign={{ xs: 'left', md: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                © 2024 AI Code Review Assistant. Built with ❤️ for developers.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;