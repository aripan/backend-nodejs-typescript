import { Router } from "express";
import {
  changeCurrentPassword,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const userRouter = Router();

//@ PUBLIC ROUTES
userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
userRouter.route("/login").post(loginUser);

//@ PRIVATE ROUTES
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refreshToken").post(refreshAccessToken);
userRouter.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);
userRouter.route("/updatePassword").patch(verifyJWT, changeCurrentPassword);
userRouter.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRouter.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
userRouter.route("/channelProfile/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default userRouter;
