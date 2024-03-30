import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { Types } from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookieOptions } from "../constants";

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

const generateAccessAndRefreshToken = async (userId: Types.ObjectId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // add the refresh token to the user
    user.refreshToken = refreshToken;

    // save the data
    // here we are passing only one field. But as we know that it is supposed to make the check from the model. And if the required fields such as username and password etc are not present, then it will give error. So we just wanna bypass the validation and saying manually that i know what i am doing.
    user.save({ validateBeforeSave: false });

    // return the tokens
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token");
  }
};

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

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  //@ fetch data from req body
  //@ validation - username or email
  //@ check if user exists or not
  //@ check password
  //@ generate access token and refresh token
  //@ send tokens in secured cookies
  //@ return response

  /* --------------------- START LOGIC BUILDING --------------------- */
  //@ fetch data from req body
  const { email, username, password } = req.body;

  //@ validation - username or email
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  //@ check if user exists or not
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //@ check password
  //! IMPORTANT: the methods we added to the user model are not available to User. Because User is the mongodb's mongoose object(model). So it does not have those custom methods. Those methods are available to user whom we fetched from mongodb.
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  //@ generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  //@ send tokens in secured cookies
  /*
  ! IMPORTANT: at this point, it is crucial to decide whether to send another request to database or not. If the operation seems to be more expensive, then we can simply use the user object.

  ! BUT keep in mind that the user object has the password field that we don't wanna pass to client and also it does not have the refresh token yet. Because we fetched the user when there was no refresh token and afterwards we mada the call to create the tokens. So if we wanna use the user object, then we need to add the refresh token first and then need to filter out the password and refresh token fields before sending it to client.
  */

  const loggedInUser = await User.findOne(user._id).select("-password -refreshToken");

  //@ return response
  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUserId = (req as any).user._id;

  // update the refreshToken in db
  await User.findByIdAndUpdate(
    loggedInUserId,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  // clear cookies
  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  //@ access the refresh token from cookies
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    //@ verify the refresh token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;

    //@ fetch user information
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    //@ compare the incoming refresh token with the stored refresh token
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is not valid");
    }

    //@ generate new access and refresh tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    //@ send cookies in response and return response
    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(401, error.message);
    }
    throw new ApiError(401, "Refresh token is not usable");
  }
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json(new ApiResponse(200, (req as any).user, "Current user fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = (req as any).user._id;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAccountDetails = asyncHandler(async (req: Request, res: Response) => {
  const { updatePayload } = req.body;

  // Check if at least one of the fields is present
  const fieldsToCheck = ["fullName", "email"];
  if (!fieldsToCheck.some((field) => field in updatePayload)) {
    throw new ApiError(400, "At least one of the fields (fullName, email, password) must be present");
  }

  const updatedUser = await User.findByIdAndUpdate(
    (req as any).user._id,
    {
      $set: updatePayload,
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req: Request, res: Response) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const updatedUser = await User.findByIdAndUpdate(
    (req as any).user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req: Request, res: Response) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    (req as any).user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [(req as any).user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
