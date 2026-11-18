const { z } = require('zod');

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const nullableDate = z.union([z.null(), z.coerce.date()]);

const register = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const taskFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  category: z.string().trim().min(1).max(50),
  dueDate: nullableDate,
};

const createTask = z.object({
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.optional(),
  priority: taskFields.priority.optional(),
  category: taskFields.category.optional(),
  dueDate: taskFields.dueDate.optional(),
});

const updateTask = z
  .object(Object.fromEntries(Object.entries(taskFields).map(([k, v]) => [k, v.optional()])))
  .refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');

const taskFilters = {
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().optional(), // created from
  to: z.string().optional(),   // created to
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  overdue: z.enum(['true']).optional(),
};

const listTasksQuery = z.object({
  ...taskFilters,
  sortBy: z.enum(['dueDate', 'createdAt', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const exportQuery = z.object(taskFilters);

const analyticsQuery = z.object({
  range: z.string().optional(), // 7d | 30d | 90d
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().trim().max(50).optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(STATUSES).optional(),
  unit: z.enum(['day', 'week', 'month']).default('day'),
  days: z.coerce.number().int().min(1).max(60).default(7), // upcoming-deadline window
});

const aiBody = z.object({
  taskIds: z.array(objectId).max(50).optional(),
  range: z.string().optional(),
  availableHours: z.number().min(0.5).max(16).optional(),
  maxTasks: z.number().int().min(1).max(15).optional(),
});

module.exports = { register, login, createTask, updateTask, listTasksQuery, exportQuery, analyticsQuery, aiBody };
