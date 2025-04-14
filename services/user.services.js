import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const findOwnerByEmailOrPhone = async (email, phone) => {
  return await prisma.owner.findFirst({
    where: {
      OR: [{ email: email }, { phone: phone }],
    },
  });
};

const findTenantByEmailOrPhone = async (email, phone) => {
  return await prisma.tenant.findFirst({
    where: {
      OR: [{ email: email }, { phone: phone }],
    },
  });
};

const generateAccessToken = async (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

const generateRefreshToken = async (user) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export { 
  generateAccessToken,
  generateRefreshToken, 
  findOwnerByEmailOrPhone,
  findTenantByEmailOrPhone };
