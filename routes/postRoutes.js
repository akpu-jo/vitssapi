import express from "express";

import {
  getPosts,
  getPhoto,
  listPostsTags,
  listPosts,
  createPost,
  getPost,
  recentPosts,
  getPostStats,
  deletePost,
  updatePost,
  getRelatedPosts,
  listSearch,
  getFeaturedPosts,
} from "../controllers/postController.js";
import { authenticate, restrictTo } from "../controllers/authController.js";

export const postRouter = express.Router();

postRouter.route("/recent").get(recentPosts, listPosts);

postRouter.route("/posts-tags-categories").post(listPostsTags);

postRouter.route("/post-stats").get(getPostStats);
postRouter.route("/photo/:slug").get(getPhoto);
postRouter.route("/related").post(getRelatedPosts);
postRouter.route("/search").get(listSearch);
postRouter.route("/featured").get(getFeaturedPosts);

postRouter
  .route("/")
  .get( listPosts)
  .post(authenticate, restrictTo("admin", "editor"), createPost);

postRouter
  .route("/:slug")
  .get( getPost)
  .patch(restrictTo("admin", "editor"), updatePost)
  .delete(restrictTo("admin"), deletePost);
