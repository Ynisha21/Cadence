const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/aiController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please wait a minute.' } });

router.use(auth, limiter, validate(s.aiBody));
router.post('/prioritize', ctrl.prioritize);
router.post('/plan', ctrl.plan);
router.post('/summary', ctrl.summary);

module.exports = router;
