const express = require('express');

const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMyDetails,
  deleteMyAccount,
  getMyProfile,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.get('/myProfile', getMyProfile, getUser);
router.patch(
  '/updateMyDetails',
  uploadUserPhoto,
  resizeUserPhoto,
  updateMyDetails
);
router.delete('/deleteMyAccount', deleteMyAccount);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
