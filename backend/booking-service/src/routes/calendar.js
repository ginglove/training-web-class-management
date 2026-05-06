const router = require('express').Router();
const ctrl = require('../controllers/calendar.controller');

// /api/calendar
router.get('/', ctrl.getCalendarEvents);
router.get('/classes/:id', ctrl.getClassEvents);
router.get('/availability', ctrl.checkAvailability);
router.get('/export', ctrl.exportICal);

// Admin manual blocks
router.get('/admin/blocks',             ctrl.getBlocks);
router.get('/admin/blocks/preflight',   ctrl.preflightBlock);
router.post('/admin/blocks',            ctrl.createBlock);
router.get('/admin/blocks/:id',         ctrl.getBlock);
router.put('/admin/blocks/:id',         ctrl.updateBlock);
router.delete('/admin/blocks/:id',      ctrl.deleteBlock);
router.get('/admin/conflicts',          ctrl.getConflicts);

module.exports = router;
