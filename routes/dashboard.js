const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');

// Apply auth middleware to all dashboard routes
router.use(requireAuth);

// Dashboard home
router.get('/', (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    user: req.session.user
  });
});

// Profile page
router.get('/profile', (req, res) => {
  res.render('pages/profile', {
    title: 'My Profile',
    user: req.session.user
  });
});

// Settings page
router.get('/settings', (req, res) => {
  res.render('pages/settings', {
    title: 'Settings',
    user: req.session.user
  });
});

module.exports = router;
