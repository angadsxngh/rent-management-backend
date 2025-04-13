import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createProperty = asyncHandler(async(req, res) => {
    
})