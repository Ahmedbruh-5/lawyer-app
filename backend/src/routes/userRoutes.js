const express = require('express');
const userController = require('../controllers/userController');
const { authenticateUser, verifyAdmin } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.post('/signup', userController.signupUser);
router.post('/verify-signup', userController.verifySignupUser);
router.post('/resend-signup-otp', userController.resendSignupOtp);
router.post('/login', userController.loginUser);

router.get('/verifyAdmin', authenticateUser, userController.verifyAdminStatus);
router.get('/me', authenticateUser, userController.getCurrentUser);

router.get('/users', authenticateUser, verifyAdmin, userController.getUsers);
router.put('/users/:id', authenticateUser, verifyAdmin, userController.updateUser);
router.delete('/users/:id', authenticateUser, verifyAdmin, userController.deleteUser);
router.delete('/users/delete-multiple', authenticateUser, verifyAdmin, userController.deleteMultipleUsers);
router.put('/bulk-access', authenticateUser, verifyAdmin, userController.bulkAccessUpdate);
router.put('/bulk-access-level-update', authenticateUser, verifyAdmin, userController.bulkAccessLevelUpdate);

router.get('/users/count', authenticateUser, verifyAdmin, userController.getTotalUserCount);
router.get('/users/access', authenticateUser, verifyAdmin, userController.getUsersWithAccessCount);
router.get('/users/no-access', authenticateUser, verifyAdmin, userController.getUsersWithoutAccessCount);

router.get('/active-users', authenticateUser, verifyAdmin, userController.getActiveUsersDynamicDays);
router.get('/user-growth', authenticateUser, verifyAdmin, userController.getUserGrowth);

module.exports = router;
