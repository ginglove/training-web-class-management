const router = require('express').Router();
const ctrl   = require('../controllers/room.controller');

router.get('/',                    ctrl.list);
router.get('/availability/all',    ctrl.getAllAvailability);
router.get('/:id',                 ctrl.getById);
router.get('/:id/availability',    ctrl.getAvailability);

module.exports = router;
