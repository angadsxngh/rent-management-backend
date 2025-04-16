import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized request");
  }

  if (!propertyId) {
    throw new ApiError(404, "Property not found");
  }

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
    },
    select: {
      ownerId: true,
    },
  });

  const ownerId = property.ownerId;

  const msg = await prisma.request.create({
    data: {
      ownerId: ownerId,
      propertyId: propertyId,
      tenantId: userId,
    },
  });

  console.log(msg);

  res.status(201).send(msg);
});

const getRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const requests = await prisma.request.findMany({
    where: {
      ownerId: userId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          country: true,
          rentAmount: true,
          imageUrl: true,
        },
      },
    },
  });

  console.log(requests);
  res.status(200).send(requests);
});

const acceptRequest = asyncHandler(async (req, res) => {
  const { userId } = req.user.id;
  const { propertyId } = req.params;
  const { tenantId } = req.query;
  await prisma.property.update({
    where: {
      ownerId: req.user.id,
      id: propertyId,
    },
    data: {
      tenantId: tenantId,
    },
  });
  await prisma.request.deleteMany({
    where: {
      ownerId: req.user.id,
      propertyId: propertyId,
    },
  });

  res.send(200).json("Assigned successfully");
});

export { createRequest, getRequests, acceptRequest };
