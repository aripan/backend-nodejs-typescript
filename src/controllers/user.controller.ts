import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.models";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";

interface RequestBody {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

// Define a custom type for 'req.files'
interface MulterFiles {
  [fieldName: string]: Express.Multer.File[];
}

const registerUser = asyncHandler(
  async (req: Request<{}, {}, RequestBody, {}> & { files: MulterFiles }, res: Response) => {
    //@ get user details from client
    //@ validation - not empty
    //@ check if user already exists: username, email
    //@ check for images, check for avatar
    //@ upload them to cloudinary: avatar
    //@ create user object => create entry in db
    //@ check for user creation
    //@ remove password and refresh token fields from response
    //@ return response

    /* ------------START THE LOGIC--------------- */
    //@ get user details from client
    const { fullName, email, username, password } = req.body;

    //@ validation - not empty
    if ([fullName, email, username, password].some((field) => field === "")) {
      throw new ApiError(400, "All fields are required");
    }

    //@ check if user already exists: username, email
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }

    //@ check for images, check for avatar
    // though we injected multer middleware in the router => multer added few more thing to the request such as req.files and we can access these files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    //@ upload them to cloudinary: avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : undefined;

    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }

    //@ create user object => create entry in db
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    //@ check for user creation
    //@ remove password and refresh token fields from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    //@ return response
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
  }
);

export { registerUser };
