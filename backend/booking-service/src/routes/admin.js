const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');

// User Management
router.get('/users',       ctrl.listUsers);
router.post('/users',      ctrl.createUser);
router.get('/users/:id',   ctrl.getUserDetail);
router.patch('/users/:id', ctrl.updateUser);
router.delete('/users/:id',ctrl.deleteUser);
router.post('/users/:id/unlock', ctrl.unlockUser);

router.get('/stats',       ctrl.getStats);
router.post('/rooms',      ctrl.createRoom);
router.patch('/rooms/:id', ctrl.updateRoom);
router.get('/audit',        ctrl.getAuditLogs);
router.post('/bookings/:id/cancel', ctrl.cancelBooking);

// System Configuration
router.get('/config',      ctrl.getConfig);
router.patch('/config',    ctrl.updateConfig);

module.exports = router;
