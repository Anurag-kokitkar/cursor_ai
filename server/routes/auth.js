const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const GitHubService = require('../services/GitHubService');
const auth = require('../middleware/auth');

const router = express.Router();
const githubService = new GitHubService();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('statistics')
      .select('-password');

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email, avatar, preferences } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;
    if (avatar) updates.avatar = avatar;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    // Check if username/email is taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user.id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === username ? 'Username already taken' : 'Email already registered'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

// GitHub OAuth routes
// GET /api/auth/github
router.get('/github', (req, res) => {
  const { redirect_uri } = req.query;
  
  const oauthUrl = githubService.getOAuthUrl(
    process.env.GITHUB_CLIENT_ID,
    redirect_uri || `${req.protocol}://${req.get('host')}/api/auth/github/callback`,
    ['repo', 'user:email']
  );

  res.redirect(oauthUrl);
});

// GET /api/auth/github/callback
router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'GitHub authorization code is required' });
    }

    // Exchange code for access token
    const tokenData = await githubService.exchangeCodeForToken(
      process.env.GITHUB_CLIENT_ID,
      process.env.GITHUB_CLIENT_SECRET,
      code
    );

    if (!tokenData.access_token) {
      return res.status(400).json({ message: 'Failed to get access token from GitHub' });
    }

    // Get user data from GitHub
    const githubUser = await githubService.getAuthenticatedUser(tokenData.access_token);

    // Check if user exists with GitHub ID
    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email: githubUser.email });
      
      if (user) {
        // Link GitHub account to existing user
        user.githubId = githubUser.id.toString();
        user.githubUsername = githubUser.login;
        user.githubAccessToken = tokenData.access_token;
        user.avatar = user.avatar || githubUser.avatar;
      } else {
        // Create new user
        user = new User({
          username: githubUser.login,
          email: githubUser.email,
          githubId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          githubAccessToken: tokenData.access_token,
          avatar: githubUser.avatar,
          // Generate a random password since this is OAuth
          password: Math.random().toString(36).substring(2, 15)
        });
      }
    } else {
      // Update existing GitHub user
      user.githubAccessToken = tokenData.access_token;
      user.avatar = user.avatar || githubUser.avatar;
      user.lastLogin = new Date();
    }

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || req.get('origin')
      : 'http://localhost:3000';

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ message: 'GitHub authentication failed', error: error.message });
  }
});

// POST /api/auth/github/disconnect
router.post('/github/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.githubId = undefined;
    user.githubUsername = undefined;
    user.githubAccessToken = undefined;
    
    await user.save();

    res.json({ message: 'GitHub account disconnected successfully' });
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    res.status(500).json({ message: 'Error disconnecting GitHub account', error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;