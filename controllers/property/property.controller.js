import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { PrismaClient } from "@prisma/client";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

const prisma = new PrismaClient();

const createProperty = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { address, city, country, rentAmount, size, state, type } = req.body;

  const mediaLocalPath = req.files?.imageUrl?.[0]?.path;

  console.log("media local path", mediaLocalPath);

  let imageUrl = "";

  if (mediaLocalPath) {
    const media = await uploadOnCloudinary(mediaLocalPath);

    if (!media?.url) {
      throw new ApiError(400, "Error uploading media to Cloudinary");
    }

    imageUrl = media.url;
  } else {
    throw new ApiError(400, "media local path is missing");
  }

  const newProperty = await prisma.property.create({
    data: {
      address: address,
      rentAmount: parseFloat(rentAmount),
      imageUrl: imageUrl,
      size: parseInt(size),
      ownerId: userId,
      city: city,
      country: country,
      state: state,
      type: type,
    },
  });

  if (!newProperty) {
    throw new ApiError(400, "error creating property");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newProperty, "Property created successfully"));
});

const getProperties = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const properties = await prisma.property.findMany({
    where: {
      ownerId: userId,
    },
  });

  console.log(properties);

  res.status(200).send(properties);
});

const getUserProperties = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const properties = await prisma.property.findMany({
    where: {
      ownerId: userId,
    },
  });

  console.log(properties);

  res.status(200).send(properties).json("properties fetched successfully");
});

const getProperty = asyncHandler(async (req, res) => {
  const { id: propertyId } = req.params;

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      country: true,
      imageUrl: true,
      rentAmount: true,
      size: true,
      createdAt: true,
      ownerId: true,
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  const existingRequest = await prisma.request.count({
    where: {
      propertyId: propertyId,
      tenantId: req.user.id,
    },
  });

  const sent = !!existingRequest;

  res.status(200).json({
    ...property,
    requestSent: sent,
  });
});

const findProperty = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const { state, country } = req.query;

  if (!city || city.length < 3) {
    console.log("Search query must be at least 3 characters long");
    return res
      .status(400)
      .json({ message: "Search query must be at least 3 characters long" });
  }

  if (!city) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const properties = await prisma.property.findMany({
      where: {
        city: { contains: city, mode: "insensitive" },
        state: { contains: state, mode: "insensitive" },
        country: { contains: country, mode: "insensitive" },
        isRented: false,
      },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        country: true,
        imageUrl: true,
        rentAmount: true,
        size: true,
        tenantId: true,
      },
    });

    console.log(properties);

    res.status(200).send(properties);
  } catch (error) {
    throw new ApiError(400, error);
  }
});

const deleteProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.body;

  try {
    await prisma.property.delete({
      where: {
        id: propertyId,
      },
    });

    res.status(200).send();
  } catch (error) {
    throw new ApiError(400, "An error occured while deleting the post");
  }
});

const tenantProperties = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const properties = await prisma.property.findMany({
    where: {
      tenantId: userId,
    },
  });

  console.log(properties);

  res.status(200).send(properties);
});

const calculateBalances = asyncHandler(async (req, res) => {
  const ownerId = req.user.id
  const properties = await prisma.property.findMany({
    where: { 
      ownerId: ownerId
     },
    select: { balance: true },
  });

  const totalBalance = properties.reduce((sum, prop) => sum + prop.balance, 0);
  return res
  .status(200)
  .json(totalBalance)
});

const clearBalance = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { propertyId } = req.params;
  const { amount, note, tenantId, mode } = req.body;

  const updatedProperty = await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      balance: {
        decrement: amount
      }
    },
    select:{
      address: true
    }
  });

  await prisma.payment.create({
    data: {
      propertyId: propertyId,
      amount,
      note,
      date: new Date(),
      ownerId: ownerId,
      tenantId: tenantId,
      address: updatedProperty.address,
      mode: mode
    },
  });

  res
  .status(200)
  .json({
    message: "Balance updated successfully",
    property: updatedProperty,
  });
});



export {
  createProperty,
  getProperties,
  getUserProperties,
  getProperty,
  findProperty,
  deleteProperty,
  tenantProperties,
  calculateBalances,
  clearBalance
};
