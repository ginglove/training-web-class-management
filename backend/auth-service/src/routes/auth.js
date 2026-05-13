const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');

router.post('/register',         ctrl.register);
router.get('/verify-email',      ctrl.verifyEmail);
router.post('/resend-verification', ctrl.resendVerification);
router.get('/check-availability',  ctrl.checkAvailability);
router.post('/login',            ctrl.login);
router.post('/refresh',          ctrl.refresh);
router.post('/logout',           ctrl.logout);
router.post('/logout-all',       ctrl.logoutAll);
router.get('/me',                ctrl.getMe);
router.patch('/me',              ctrl.updateMe);
router.get('/sessions',          ctrl.getSessions);
router.delete('/sessions/:id',   ctrl.revokeSession);
router.get('/activity',          ctrl.getActivityHistory);
router.post('/change-password',  ctrl.changePassword);
router.post('/forgot-password',  ctrl.forgotPassword);
router.post('/reset-password',   ctrl.resetPassword);

module.exports = router;
