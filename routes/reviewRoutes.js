const express = require('express');
const {
  getReview,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  setTourUserIDs,
} = require('../controllers/reviewController');

const { protect, restrictTo } = require('../controllers/authController');

// line 21 '/' does not have tourId but you want it here from tourRouter
// hence { mergeParams: true }

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIDs, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
