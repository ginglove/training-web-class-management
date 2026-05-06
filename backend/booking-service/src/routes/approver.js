const router = require('express').Router();
const ctrl   = require('../controllers/approver.controller');

// SRS 20.6 — Approver dedicated endpoints
router.get('/queue',       ctrl.queue);       // PENDING_APPROVAL list
router.get('/history',     ctrl.history);     // Processed history
router.get('/stats',       ctrl.stats);       // KPI stats

module.exports = router;
