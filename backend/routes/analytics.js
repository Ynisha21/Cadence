const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth, validate(s.analyticsQuery, 'query'));
router.get('/overview', ctrl.overview);
router.get('/trends', ctrl.trends);
router.get('/categories', ctrl.categories);
router.get('/priorities', ctrl.priorities);
router.get('/deadlines', ctrl.deadlines);
router.get('/report', ctrl.report);

module.exports = router;
