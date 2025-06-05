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

const createPaymentRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;
  const amount = req.body.amount;

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

  const msg = await prisma.paymentRequest.create({
    data: {
      ownerId: ownerId,
      propertyId: propertyId,
      tenantId: userId,
      amount: amount,
    },
  });

  res.status(201).send(msg);
});

const getRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const requests = await prisma.request.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
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

  const paymentReqs = await prisma.paymentRequest.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
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

  const taggedRequests = requests.map((req) => ({ ...req, type: "request" }));
  const taggedPaymentReqs = paymentReqs.map((req) => ({
    ...req,
    type: "paymentRequest",
  }));

  const result = [...taggedRequests, ...taggedPaymentReqs].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.status(200).send(result);
});

const acceptRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;
  const { tenantId, tenantName } = req.query;

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
    },
  });

  await prisma.property.update({
    where: {
      ownerId: req.user.id,
      id: propertyId,
    },
    data: {
      tenantName: tenantName,
      tenantId: tenantId,
      isRented: true,
      balance: property.rentAmount,
      assignedAt: new Date(),
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

const acceptPaymentRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;
  const amount = parseFloat(req.query.amount); // ensure it's a number

  const updatedProperty = await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      balance: {
        decrement: amount,
      },
      status: "Accepted",
    },
  });

  return res.status(200).json(updatedProperty);
});


const deleteRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;
  const { tenantId, tenantName } = req.query;
  console.log("userId: ", userId);

  await prisma.request.updateMany({
    where: {
      ownerId: userId,
      propertyId: propertyId,
      tenantId: tenantId,
    },
    data: {
      status: "rejected",
    },
  });
  res.status(200).json("Rejected successfully");
});

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

  const payments = await prisma.paymentRequest.findMany({
    where: {
      tenantId: userId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
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

  const taggedRequests = alerts.map((req) => ({ ...req, type: "request" }));
  const taggedPaymentReqs = payments.map((req) => ({
    ...req,
    type: "paymentRequest",
  }));

  const result = [...taggedRequests, ...taggedPaymentReqs].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.status(200).send(result);
});

export {
  createRequest,
  getRequests,
  acceptRequest,
  getAlerts,
  deleteRequest,
  createPaymentRequest,
  acceptPaymentRequest
};
