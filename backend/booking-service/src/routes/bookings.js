const router = require('express').Router();
const ctrl          = require('../controllers/booking.controller');
const commentCtrl   = require('../controllers/comments.controller');

router.get('/',                       ctrl.list);
router.get('/my-bookings',            ctrl.list);
router.get('/stats',                  ctrl.getStats);
router.get('/reviewer-history',       ctrl.reviewerHistory);
router.post('/',                      ctrl.create);
router.get('/:id',                    ctrl.getById);
router.patch('/:id/submit',           ctrl.submit);
router.patch('/:id/claim',            ctrl.claim);
router.patch('/:id/unclaim',          ctrl.unclaim);
router.patch('/:id/forward',          ctrl.forward);
router.patch('/:id/approve',          ctrl.approve);
router.patch('/:id/reject',           ctrl.reject);
router.patch('/:id/cancel',           ctrl.cancel);

// Comments & history sub-resources (SRS 19.6)
router.post('/:id/comments',          commentCtrl.addComment);
router.get('/:id/comments',           commentCtrl.listComments);
router.get('/:id/history',            commentCtrl.getHistory);

module.exports = router;
