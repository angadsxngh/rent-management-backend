import { Router } from "express";
import {verifyJWT} from '../../middleware/auth.middleware.js'
import { deleteTenant, getTenant, getTenantTransactions, loginTenant, logoutUser, registerTenant } from "../../controllers/users/tenant.controller.js";
import { findProperty, getProperty, tenantProperties } from "../../controllers/property/property.controller.js";
import { createPaymentRequest, createRequest, getAlerts } from "../../controllers/request/request.controller.js";


const router = new Router();

router.route('/register').post(registerTenant)

router.route('/login').post(loginTenant)

//secured routes

//account

router.route('/get-user').get(verifyJWT, getTenant)

router.route('/logout').post(verifyJWT, logoutUser)

router.route('/fetch-transactions').get(verifyJWT, getTenantTransactions)

router.route('/delete-account').post(verifyJWT, deleteTenant)

//properties

router.route('/find-property/:city').get(verifyJWT, findProperty)

router.route('/property/:id').get(verifyJWT, getProperty)

router.route('/properties').get(verifyJWT, tenantProperties)

//requests

router.route('/create-request/:id').post(verifyJWT, createRequest)

router.route('/get-alerts').get(verifyJWT, getAlerts)

router.route('/create-payment-request/:id').post(verifyJWT, createPaymentRequest)

export default router