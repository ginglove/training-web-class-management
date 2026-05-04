const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');

router.post('/register',         ctrl.register);
router.post('/login',            ctrl.login);
router.post('/refresh',          ctrl.refresh);
router.post('/logout',           ctrl.logout);
router.get('/me',                ctrl.getMe);
router.patch('/me',              ctrl.updateMe);
router.post('/change-password',  ctrl.changePassword);

module.exports = router;
