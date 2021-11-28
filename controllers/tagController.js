import Tag from "../models/tagModel.js";
import slugify from "slugify";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import Post from "../models/postModel.js";

export const createTag = catchAsync(async (req, res) => {
  const { name } = req.body;
  console.log(name);

  let slug = slugify(name).toLowerCase();

  const newTag = await Tag.create({ name, slug });

  res.status(200).json(newTag);
});

export const getTags = catchAsync(async (req, res, next) => {
  const tags = await Tag.find().limit(req.query.limit);

  res.status(200).json(tags);
});

export const getTag = catchAsync(async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  const tag = await Tag.findOne({ slug });

  if (!tag) {
    return next(new AppError("Tag not found", 404));
  }

  const posts = await Post.find({ tags: tag })
    .populate("tags", " _id name slug")
    .populate("writenBy", " _id fullname username profile")
    .select(
      "_id title slug excerpt tags writenBy createdAt updatedAt"
    );
  res.status(200).json({tag, posts});
});

export const deleteTag = catchAsync(async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  const tag = await Tag.findOneAndRemove({ slug });
  if (!tag) {
    return next(new AppError("Tag not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Tag deleted successfully",
  });
});
