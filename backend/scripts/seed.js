const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Usage: npm run seed  -> creates demo@example.com / Password123 with ~90 realistic tasks over 60 days
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Task = require('../models/Task');

const DAY = 86400000;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const CATS = ['Development', 'Study', 'Work', 'Personal'];
const PRI = ['Low', 'Medium', 'High'];
const VERBS = ['Draft', 'Review', 'Fix', 'Plan', 'Finish', 'Research', 'Refactor', 'Write'];
const NOUNS = ['report', 'API endpoint', 'chapter notes', 'budget', 'presentation', 'unit tests', 'resume', 'schedule'];

(async () => {
  await mongoose.connect(env.mongoUri);
  await User.deleteOne({ email: 'demo@example.com' });
  const user = await User.create({ name: 'Demo User', email: 'demo@example.com', password: await bcrypt.hash('Password123', 10) });
  const now = Date.now();
  const tasks = Array.from({ length: 90 }, () => {
    const createdAt = new Date(now - rnd(0, 60) * DAY);
    const dueDate = Math.random() < 0.9 ? new Date(createdAt.getTime() + rnd(1, 14) * DAY) : null;
    const roll = Math.random();
    const status = roll < 0.6 ? 'Completed' : roll < 0.8 ? 'In Progress' : 'Pending';
    let completedAt = null;
    if (status === 'Completed') {
      const base = dueDate ? dueDate.getTime() : createdAt.getTime() + 5 * DAY;
      completedAt = new Date(Math.min(now, Math.max(createdAt.getTime() + 3600000, base + rnd(-5, 3) * DAY)));
    }
    return { userId: user._id, title: `${pick(VERBS)} ${pick(NOUNS)}`, description: '', status, priority: pick(PRI),
      category: pick(CATS), dueDate, completedAt, createdAt, updatedAt: completedAt || createdAt };
  });
  await Task.insertMany(tasks);
  console.log(`Seeded ${tasks.length} tasks. Login: demo@example.com / Password123`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });