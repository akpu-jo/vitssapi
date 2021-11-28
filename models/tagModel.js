import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, " Tag name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamp: true }
);

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
