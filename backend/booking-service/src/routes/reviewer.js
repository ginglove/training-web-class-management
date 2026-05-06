const router = require('express').Router();
const ctrl   = require('../controllers/reviewer.controller');

// SRS 19.6 — Reviewer dedicated endpoints
router.get('/queue',       ctrl.queue);       // PENDING_REVIEW list
router.get('/in-progress', ctrl.inProgress);  // IN_REVIEW by me
router.get('/history',     ctrl.history);     // Processed history
router.get('/stats',       ctrl.stats);       // KPI stats

module.exports = router;
