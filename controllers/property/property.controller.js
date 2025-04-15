import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { PrismaClient } from "@prisma/client";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

const prisma = new PrismaClient();

const createProperty = asyncHandler(async (req, res) => {
    const userId = req.user.id

    const { address, city, country, rentAmount, size, state, type } = req.body


    const mediaLocalPath = req.files?.imageUrl?.[0]?.path

    console.log("media local path",mediaLocalPath);

    let imageUrl = "";

    if(mediaLocalPath) {
        const media = await uploadOnCloudinary(mediaLocalPath);

        if (!media?.url) {
            throw new ApiError(400, "Error uploading media to Cloudinary");
        }

        imageUrl = media.url;
    }
    else{
        throw new ApiError(400, "media local path is missing")
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
            type: type
        }
    })

    if (!newProperty) {
        throw new ApiError(400, "error creating property")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newProperty, "Property created successfully"))

})

const getProperties = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const properties = await prisma.property.findMany({
        where: {
            ownerId: userId
        }
    })

    console.log(properties)

    res
    .status(200)
    .send(properties)
    
})

const getUserProperties = asyncHandler(async (req, res) => {

    const { userId } = req.params

    const properties = await prisma.property.findMany({
        where: {
            ownerId: userId
        }
    })

    console.log(properties)

    res
        .status(200)
        .send(properties)
        .json("properties fetched successfully")
})

const getProperty = asyncHandler(async (req, res) => {

    const propertyId = req.params

    const property = await prisma.property.findFirst({
        where: {
            id: propertyId
        }
    })

    console.log(property)

    res
        .status(200)
        .json("fetched succesfully")
})

const findProperty = asyncHandler(async (req, res) => {

    const { city } = req.params

    if (!city || city.length < 3) {
        console.log("Search query must be at least 3 characters long")
        return res.status(400).json({ message: "Search query must be at least 3 characters long" });
    }

    if (!city) {
        return res.status(400).json({ message: "Search query is required" });
    }

    try {
        const properties = await prisma.property.findMany({
            where: {
                city: { contains: city, mode: "insensitive" }
            },
            select: {
                id: true,
                address: true,
                city: true,
                country: true,
                imageUrl: true,
                size: true
            }
        })

        console.log(properties)

        res
            .status(200)
            .send(properties)
            .json("properties fetched")
    } catch (error) {
        throw new ApiError(400, "error occured while fetching properties in this area")
    }
})

const deleteProperty = asyncHandler(async (req, res) => {

    const { propertyId } = req.body;

    try {
        await prisma.property.delete({
            where: {
                id: propertyId
            }
        })

        res
        .status(200)
        .send()
    } catch (error) {
        throw new ApiError(400, "An error occured while deleting the post")
    }
})

export {
    createProperty,
    getProperties,
    getUserProperties,
    getProperty,
    findProperty,
    deleteProperty
}