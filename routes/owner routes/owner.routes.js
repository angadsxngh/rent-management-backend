import { Router } from "express";
import { deleteOwner, loginOwner, logoutOwner, registerOwner } from "../../controllers/users/owner.controller.js";
import {verifyJWT} from '../../middleware/auth.middleware.js'
import {createProperty, findProperty, getProperties, getUserProperties} from "../../controllers/property/property.controller.js"
import { upload } from "../../middleware/multer.middleware.js";

const router = new Router()

router.route('/register').post(registerOwner)

router.route('/login').post(loginOwner)

//secured routes

router.route('/add-property')
    .post(upload.fields([
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

router.route('/logout').post(verifyJWT, logoutOwner)

router.route('/delete-account').post(verifyJWT, deleteOwner)

export default router