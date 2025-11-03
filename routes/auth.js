const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Show login form
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('pages/login', {
    title: 'Login',
    error: null
  });
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = User.authenticate(email, password);

    if (user) {
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      res.redirect('/dashboard');
    } else {
      res.render('pages/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }
  } catch (error) {
    res.render('pages/login', {
      title: 'Login',
      error: 'An error occurred. Please try again.'
    });
  }
});

// Show register form
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('pages/register', {
    title: 'Register',
    error: null
  });
});

// Handle register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.render('pages/register', {
        title: 'Register',
        error: 'Email already registered'
      });
    }

    // Create new user
    const newUser = User.create({ name, email, password });

    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };

    res.redirect('/dashboard');
  } catch (error) {
    res.render('pages/register', {
      title: 'Register',
      error: 'An error occurred. Please try again.'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
