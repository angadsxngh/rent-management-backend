import { Router } from "express";
import { deleteOwner, getOwner, getTransactions, loginOwner, logoutOwner, registerOwner } from "../../controllers/users/owner.controller.js";
import {verifyJWT} from '../../middleware/auth.middleware.js'
import { logoutUser } from "../../controllers/users/tenant.controller.js";
import {calculateBalances, clearBalance, createProperty, deleteProperty, findProperty, getProperties, getUserProperties} from "../../controllers/property/property.controller.js"
import { upload } from "../../middleware/multer.middleware.js";
import { acceptPaymentRequest, acceptRequest, deleteRequest, getRequests } from "../../controllers/request/request.controller.js";

const router = new Router()

router.route('/register').post(registerOwner)

router.route('/login').post(loginOwner)

//secured routes

//properties

router.route('/add-property').post(upload.fields([
    {
        name:"imageUrl",
        maxCount: 1
    }
    ]),
    verifyJWT, 
    createProperty)

router.route('/your-properties').get(verifyJWT, getProperties)

router.route('/properties/:userId').get(verifyJWT, getUserProperties)

router.route('/find-property/:city').get(verifyJWT, findProperty)

router.route('/add-property').post(verifyJWT, createProperty)

router.route('/delete-property').post(verifyJWT, deleteProperty)

router.route('/check-balances').get(verifyJWT, calculateBalances)

router.route('/settle-up/:propertyId').post(verifyJWT, clearBalance)

//account

router.route('/delete-account').post(verifyJWT, deleteOwner)

router.route('/get-user').get(verifyJWT, getOwner)

router.route('/logout').post(verifyJWT, logoutUser)

router.route('/fetch-transactions').get(verifyJWT, getTransactions)

//requests

router.route('/get-requests').get(verifyJWT, getRequests)

router.route('/accept-request/:propertyId').post(verifyJWT, acceptRequest)

router.route('/delete-request/:propertyId').post(verifyJWT, deleteRequest)

router.route('/accept-payment/:propertyId').post(verifyJWT, acceptPaymentRequest)


export default router