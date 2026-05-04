const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');

router.get('/users',       ctrl.listUsers);
router.patch('/users/:id', ctrl.updateUser);
router.get('/stats',       ctrl.getStats);
router.post('/rooms',      ctrl.createRoom);
router.patch('/rooms/:id', ctrl.updateRoom);

module.exports = router;
