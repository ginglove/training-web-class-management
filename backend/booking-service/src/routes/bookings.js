const router = require('express').Router();
const ctrl   = require('../controllers/booking.controller');

router.get('/',                ctrl.list);
router.get('/stats',           ctrl.getStats);
router.post('/',               ctrl.create);
router.get('/:id',             ctrl.getById);
router.patch('/:id/submit',    ctrl.submit);
router.patch('/:id/claim',     ctrl.claim);
router.patch('/:id/forward',   ctrl.forward);
router.patch('/:id/approve',   ctrl.approve);
router.patch('/:id/reject',    ctrl.reject);
router.patch('/:id/cancel',    ctrl.cancel);

module.exports = router;
