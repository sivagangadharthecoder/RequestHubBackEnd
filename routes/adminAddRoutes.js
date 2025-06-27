import express from 'express';

import {
    register,
    login,
    logout,
    sendResetOtp,
    resetPassword,

} from '../controllers/adminAddController.js';


const adminAddRouter = express.Router();

adminAddRouter.post('/register2', register);
adminAddRouter.post('/login2', login);
adminAddRouter.post('/logout2', logout);
adminAddRouter.post('/adminresetotp', sendResetOtp);
adminAddRouter.post('/adminresetpassword', resetPassword);

export default adminAddRouter;

