import express from 'express';

import {
  getUsers,
  createUser,
  getUser,
  updateUser,
  updateMe,
  deleteMe,
} from '../controllers/userController.js';
import {restrictedRoute, privateRoute, authenticate, sendUser } from "../controllers/authController.js";

export const userRouter = express.Router();

userRouter.get("/admin", authenticate, restrictedRoute)
userRouter.get("/private", authenticate, privateRoute)
userRouter.post("/auth", authenticate, sendUser);
// userRouter.post("/signup", signup);
// userRouter.post("/signin", signin);
// userRouter.get("/signout", signout);
// userRouter.post("/forgot-password", forgotPassword);
// userRouter.patch("/reset-password/:token", resetPassword);
// userRouter.patch("/update-password", protect, updatePassword);
userRouter.patch("/update-me", updateMe);
userRouter.delete("/delete-me", deleteMe);

userRouter.route('/').get(getUsers).post(createUser);

userRouter
  .route('/:username')
  .get(getUser)
  .patch(updateUser)