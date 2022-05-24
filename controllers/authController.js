const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/myProfile`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createAndSendToken(user, 200, res);
});

exports.logout = catchAsync((req, res, next) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  // Token === Logged in or not

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }

  //   Verification

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //   User exists or not

  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(new AppError('User with this token no longer exists', 401));
  }

  //   Checking if Password is changed after token generation or not

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User changed the password recently. Please login again',
        401
      )
    );
  }
  res.locals.user = freshUser;
  req.user = freshUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // Token === Logged in or not

  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      const freshUser = await User.findById(decoded.id);

      if (!freshUser) {
        return next();
      }

      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      res.locals.user = freshUser;
      return next();
    }
    next();
  } catch (err) {
    return next();
  }
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorised to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user exists with this email address', 404));
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email({
      user,
      resetURL,
    }).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `An error occurred while sending an email. Try again later , ${err}`,
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token
  const hasshedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hasshedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  // if token has not expired, and user exists, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // update changedPasswordAt
  // log the user in, send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // check if the posted, current password is correct
  if (!(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError('Your current password is wrong', 401));

  // if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // log the user in, send JWT
  createAndSendToken(user, 200, res);
});
