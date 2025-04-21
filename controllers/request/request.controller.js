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

  res.status(201).send(msg);
});

const getRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const requests = await prisma.request.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
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

  res.status(200).send(requests);
});

const acceptRequest = asyncHandler(async (req, res) => {
  const userId  = req.user.id;
  const { propertyId } = req.params;
  const { tenantId, tenantName } = req.query;
  await prisma.property.update({
    where: {
      ownerId: req.user.id,
      id: propertyId,
    },
    data: {
      tenantName: tenantName,
      tenantId: tenantId,
      isRented: true
    },
  });
  await prisma.request.updateMany({
    where: {
      ownerId: req.user.id,
      propertyId: propertyId,
      tenantId: tenantId,
    },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
    },
  });
  await prisma.request.deleteMany({
    where: {
      ownerId: req.user.id,
      propertyId: propertyId,
      NOT: {
        tenantId: tenantId,
      },
    },
  });

  res.status(200).json("Assigned successfully");
});

const deleteRequest = asyncHandler(async (req, res) => {
  const  userId  = req.user.id;
  const { propertyId } = req.params;
  const { tenantId, tenantName } = req.query;
  console.log("userId: ",userId)

  await prisma.request.updateMany({
    where: {
      ownerId: userId,
      propertyId: propertyId,
      tenantId: tenantId
    },
    data:{
      status: "rejected"
    }
  })
  res.status(200).json("Rejected successfully");
})

const getAlerts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const alerts = await prisma.request.findMany({
    where: {
      tenantId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      owner: {
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

  res
  .status(200)
  .send(alerts)
});

export { 
  createRequest,
  getRequests, 
  acceptRequest, 
  getAlerts, 
  deleteRequest };
