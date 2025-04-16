import { Router } from "express";
import {verifyJWT} from '../../middleware/auth.middleware.js'
import { deleteTenant, getTenant, loginTenant, logoutUser, registerTenant } from "../../controllers/users/tenant.controller.js";
import { findProperty, getProperty } from "../../controllers/property/property.controller.js";
import { createRequest } from "../../controllers/request/request.controller.js";


const router = new Router();

router.route('/register').post(registerTenant)

router.route('/login').post(loginTenant)

//secured routes

router.route('/get-user').get(verifyJWT, getTenant)

router.route('/logout').post(verifyJWT, logoutUser)

router.route('/delete-account').post(verifyJWT, deleteTenant)

//properties

router.route('/find-property/:city').get(verifyJWT, findProperty)

router.route('/property/:id').get(verifyJWT, getProperty)

//requests

router.route('/create-request/:id').post(verifyJWT, createRequest)



export default router