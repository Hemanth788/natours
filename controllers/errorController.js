const AppError = require('../utils/AppError');

function handleDBECastError(err) {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 404);
}

function handleDBEDuplicateFields(err) {
  const value = err.errmsg.match(/(['"'])(\\?.)*?\1/)[0];
  const message = `Duplicate Field value for ${value}, please enter a different value`;
  return new AppError(message, 400);
}

function handleDBEValidationError(err) {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. s')}`;
  return new AppError(message, 400);
}

function sendErrorForDevelopment(err, req, res) {
  console.log('Error', err);

  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      error: err,
      stack: err.stack,
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
}

function sendErrorForProduction(err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.log('Error', err);
    return res.status(err.statusCode).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  // eslint-disable-next-line no-lonely-if
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  } else {
    console.log('Error', err);
    return res.status(err.statusCode).render('error', {
      msg: 'Please try again or something else',
      title: 'Something went wrong',
    });
  }
}

function handleJWTError() {
  return new AppError('Invalid token. Please login again', 401);
}

function handleJWTExpiredError() {
  return new AppError('Token Expired. Please login again', 401);
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorForDevelopment(err, req, res);
  } else {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') {
      error = handleDBECastError(error);
    }
    if (error.code === '11000') {
      error = handleDBEDuplicateFields(error);
    }
    if (error.name === 'ValidationError') {
      error = handleDBEValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorForProduction(error, req, res);
  }
};
