const mongoose = require('mongoose');

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3 };

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    priorityRank: { type: Number, default: 2 }, // enables sorting by priority
    category: { type: String, trim: true, maxlength: 50, default: 'Personal' },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.priorityRank;
        return ret;
      },
    },
  }
);

taskSchema.index({ userId: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, completedAt: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });

taskSchema.pre('validate', function (next) {
  this.priorityRank = PRIORITY_RANK[this.priority] || 2;
  next();
});

// Keep completedAt consistent with status.
taskSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('status')) {
    if (this.status === 'Completed') {
      if (!this.completedAt) this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
