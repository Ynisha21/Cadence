const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.get('/tasks/export', auth, validate(s.exportQuery, 'query'), ctrl.exportTasks);

module.exports = router;
