import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../services/user.services.js";
import { findOwnerByEmailOrPhone } from "../../services/user.services.js";

const prisma = new PrismaClient();

const options = {
  httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/'
};

const registerOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if ([name, email, phone, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await prisma.owner.findUnique({
    where: {
      email: email,
    },
  });

  if (existedUser) {
    throw new ApiError(400, "email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.owner.create({
    data: {
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
    },
  });

  const accessToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  const createdUser = await prisma.owner.findUnique({
    where: {
      email: email,
    },
  });

  if (!createdUser) {
    throw new ApiError(400, "error creating new user");
  }

  res
  .cookie("refreshToken", refreshToken, options)
  .cookie("accessToken", accessToken, options)
  
  res.send(user)
  
});

const loginOwner = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if (!(email || phone)) {
    throw new ApiError(400, "email or phone number is required");
  }

  const user = await findOwnerByEmailOrPhone(email, phone);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "password is incorrect");
  }

  const accessToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
    
  res.send({
    user: user
  })
});

//secured controllers

const getOwner = asyncHandler(async(req, res) => {
  res.send({
    user: req.user
  })
})

const logoutOwner = asyncHandler(async (req, res) => {


  res.clearCookie("accessToken", options)
  res.clearCookie("refreshToken", options)

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out!"))
})

const deleteOwner = asyncHandler(async (req, res) => {

  const { password } = req.body;

  const user = await prisma.owner.findFirst({
    where: {
      id: req.user.id
    }
  })

  if (!password) {
    throw new ApiError(400, "password field cannot be empty")
  }

  const isPasswordValid = bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new ApiError(400, "invalid password")
  }

  await prisma.property.deleteMany({
    where: {
      ownerId: req.user.id
    }
  })

  await prisma.owner.delete({
    where: {
      id: req.user.id
    }
  })


  res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json("Account deleted succesfully")
})

export {
  registerOwner,
  loginOwner,
  logoutOwner,
  deleteOwner,
  getOwner
};
