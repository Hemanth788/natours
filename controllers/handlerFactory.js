const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`No ${Model.modelName} found with the given ID`, 404)
      );
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedDoc) {
      return next(
        new AppError(`No ${Model.modelName} found with the given ID`, 404)
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        updatedDoc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { newDoc },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const fetchedDoc = await query;
    if (!fetchedDoc) {
      return next(
        new AppError(`No ${Model.modelName} found with the given ID`),
        404
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        fetchedDoc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    //   To allow for nested GET reviews on Tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitToFields()
      .pagination();
    const allDocs = await features.query;
    res.status(200).json({
      status: 'success',
      results: allDocs.length,
      data: {
        allDocs,
      },
    });
  });
