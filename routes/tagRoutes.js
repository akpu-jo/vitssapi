import express from "express";

import {
  createTag,
  getTags,
  getTag,
  deleteTag,
} from "../controllers/tagController.js";
import {  restrictTo } from "../controllers/authController.js";

export const tagRouter = express.Router();

tagRouter
  .route("/")
  .get( getTags)
  .post( restrictTo("admin", "editor"), createTag);

tagRouter
  .route("/:slug")
  .get( getTag)
  .patch()
  .delete(restrictTo("admin"), deleteTag);
