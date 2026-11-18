const mongoose = require('mongoose');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildTaskFilter } = require('../services/taskService');

const SORT_FIELD = { dueDate: 'dueDate', createdAt: 'createdAt', priority: 'priorityRank' };

// Ownership is enforced by ALWAYS querying { _id, userId }. Other users' tasks look like 404s.
async function findOwned(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid task id');
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

exports.create = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, task });
});

exports.list = asyncHandler(async (req, res) => {
  const { sortBy, order, page, limit, ...filters } = req.valid.query;
  const filter = buildTaskFilter(req.user._id, filters);
  const dir = order === 'asc' ? 1 : -1;
  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ [SORT_FIELD[sortBy]]: dir, _id: dir }).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter),
  ]);
  res.json({ success: true, data: tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.get = asyncHandler(async (req, res) => {
  res.json({ success: true, task: await findOwned(req) });
});

exports.update = asyncHandler(async (req, res) => {
  const task = await findOwned(req);
  task.set(req.body);
  await task.save(); // runs hooks: completedAt + priorityRank stay consistent
  res.json({ success: true, task });
});

exports.remove = asyncHandler(async (req, res) => {
  const task = await findOwned(req);
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});
