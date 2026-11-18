const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.post('/register', validate(s.register), ctrl.register);
router.post('/login', validate(s.login), ctrl.login);
router.get('/me', auth, ctrl.me);

module.exports = router;
