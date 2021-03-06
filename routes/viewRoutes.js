const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getMyProfile,
  updateUserData,
} = require('../controllers/viewController');
const { isLoggedIn, protect } = require('../controllers/authController');

const router = express.Router();

router.use((req, res, next) => {
  next();
});

router.get('/', isLoggedIn, getOverview);

router.get('/tour/:slug', isLoggedIn, getTour);

router.get('/login', isLoggedIn, getLoginForm);

router.get('/myProfile', protect, getMyProfile);

router.post('/submit-user-data', protect, updateUserData);

module.exports = router;
