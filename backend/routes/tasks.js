const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth);
router.route('/').post(validate(s.createTask), ctrl.create).get(validate(s.listTasksQuery, 'query'), ctrl.list);
router.route('/:id').get(ctrl.get).put(validate(s.updateTask), ctrl.update).patch(validate(s.updateTask), ctrl.update).delete(ctrl.remove);

module.exports = router;
