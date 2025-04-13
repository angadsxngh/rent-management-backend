import { Router } from "express";
import { loginOwner, logoutOwner, registerOwner } from "../../controllers/users/owner.controller.js";
import {verifyJWT} from '../../middleware/auth.middleware.js'

const router = new Router()

router.route('/register').post(registerOwner)

router.route('/login').post(loginOwner)

//secured routes

router.route('/logout').post(verifyJWT, logoutOwner)

export default router