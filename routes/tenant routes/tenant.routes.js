import { Router } from "express";
import {verifyJWT} from '../../middleware/auth.middleware.js'
import { deleteTenant, getTenant, loginTenant, logoutUser, registerTenant } from "../../controllers/users/tenant.controller.js";


const router = new Router();

router.route('/register').post(registerTenant)

router.route('/login').post(loginTenant)

//secured routes

router.route('/get-user').get(verifyJWT, getTenant)

router.route('/logout').post(verifyJWT, logoutUser)

router.route('/delete-account').post(verifyJWT, deleteTenant)

export default router