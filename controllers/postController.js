import Post from "../models/postModel.js";
import Tag from "../models/tagModel.js";
import formidable from "formidable";
import _ from "lodash";
import fs from "fs";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

const populate = Post.find({})
  .populate("tags", " _id name slug")
  .populate("writenBy", " _id fullname username profile")
  .select("_id title slug excerpt tags writenBy createdAt updatedAt");

export const recentPosts = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-createdAt";
  next();
};

export const getRelatedPosts = catchAsync(async (req, res, next) => {
  let limit = 3;
  const { _id, tags } = req.body;

  const posts = await Post.find({ _id: { $ne: _id }, tags: { $in: tags } })
    .limit(limit)
    .populate("writenBy", " _id fullname username profile")
    .select("_id title slug excerpt tags writenBy createdAt updatedAt");

  res.status(200).json({
    success: true,
    posts,
  });
});

export const getFeaturedPosts = catchAsync(async (req, res, next) => {
  const posts = await Post.find({ featured: true })
    .populate("writenBy", " _id fullname username profile")
    .select("_id title slug excerpt tags writenBy createdAt updatedAt");

    res.status(200).json({
      success: true,
      posts,
    });
});
export const listPosts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(populate, req.query).sort().paginate();
  const posts = await features.query;
  const count = await Post.countDocuments({});

  res.status(200).json({
    success: true,
    size: posts.length,
    posts,
    count,
  });
});

export const listPostsTags = catchAsync(async (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  const features = new APIFeatures(populate, req.query)
    .sort()
    .limit(limit)
    .skip(skip);
  const count = await Post.countDocuments({});
  const posts = await features.query;
  const tags = await Tag.find();
  res
    .status(200)
    .json({ success: true, size: posts.length, posts, tags, count });
});

// complex! need to revisit
export const getPosts = async (req, res) => {
  const features = new APIFeatures(Post.find(), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();
  const posts = await features.query;
  res.send(posts);
};

export const getPost = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const post = await Post.findOne({ slug })
    .populate("categories", " _id name slug")
    .populate("tags", " _id name slug")
    .populate("writenBy", " _id fullname username profile")
    .select(
      "_id title body slug mtitle mdesc tags writenBy createdAt updatedAt"
    );

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  res.status(200).json({ success: true, post });
});

export const listSearch = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  if (search) {
    const result = await Post.find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
      ],
    })
      .populate("tags", " _id name slug")
      .select("_id title slug excerpt tags writenBy createdAt updatedAt");

    res.status(200).json({
      success: true,
      result,
    });
  }
});

export const getPhoto = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  const photo = await Post.findOne({ slug }).select("photo");

  res.set("Content-Type", photo.photo.contentType);
  return res.send(photo.photo.data);
});

export const createPost = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return next(new AppError("Image could not upload", 400));
    }

    const { title, body, tags } = fields;

    let post = new Post();
    post.title = title;
    post.body = body;
    post.writenBy = req.user._id;

    let arrayOfTags = tags && tags.split(",");

    if (files.photo) {
      if (files.photo.size > 10000000) {
        return res.status(400).json({
          error: "Image should be less then 1mb in size",
        });
      }
      post.photo.data = fs.readFileSync(files.photo.path);
      post.photo.contentType = files.photo.type;
    }

    post.save((err, result) => {
      if (err) {
        return res.status(400).json(err);
      }
      // res.json(result);
      Post.findByIdAndUpdate(
        result._id,
        { $push: { tags: arrayOfTags } },
        { new: true }
      ).exec((err, result) => {
        if (err) {
          return res.status(400).json(err);
        } else {
          res.status(200).json({ success: true, result });
        }
      });
    });
  });
};

export const updatePost = (req, res) => {
  const slug = req.params.slug;
  console.log(slug);

  Post.findOne({ slug }).exec((err, oldPost) => {
    if (err) {
      return res.status(400).json(err);
    }

    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: "Image could not upload",
        });
      }

      let slugBeforeMerge = oldPost.slug;
      oldPost = _.merge(oldPost, fields);
      oldPost.slug = slugBeforeMerge;

      const { body, mdesc, tags } = fields;

      if (body) {
        oldPost.excerpt = smartTrim(body, 320, " ", " ...");
        oldPost.mdesc = body.substring(0, 160).replace(/<\/?[^>]+(>|$)/g, "");
      }

      if (tags) {
        oldPost.tags = tags.split(",");
      }

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res.status(400).json({
            error: "Image should be less then 1mb in size",
          });
        }
        oldPost.photo.data = fs.readFileSync(files.photo.path);
        oldPost.photo.contentType = files.photo.type;
      }

      oldPost.save((err, result) => {
        if (err) {
          return res.status(400).json(err);
        }
        // result.photo = undefined;
        res.json(result);
      });
    });
  });
};

// export const updatePost = catchAsync( async (req, res, next) => {
//   const slug = req.params.slug

//   const post = await Post.findOneAndUpdate(slug, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!post) {
//     return res.status(404).send("Post not found");
//   }
//   res.status(200).send(post);
// });

export const deletePost = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;

  const post = await Post.findOneAndDelete({ slug });

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Post deleted Successfully",
    data: null,
  });
});

export const getPostStats = async (req, res, next) => {
  const stats = await Post.aggregate([
    {
      $match: { views: { $gte: 5 } },
    },
    {
      $group: {
        _id: null,
        avgViews: { $avg: "$views" },
        // numLikes: 2,
        // numComments: 9
        numViews: { $sum: "$views" },
        numSongs: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "Success",
    data: stats,
  });
};
