import User from '../models/userModel.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).send(users);
};

export const getUser = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (user) {
    res.status(200).send(user);
  } else {
    res.status(404).send({ message: 'User not found' });
  }
};

export const createUser = async (req, res) => {
  const user = new User(req.body);
  const createdUser = await user.save();
  res.status(200).send(createdUser);
};

export const updateMe = async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    res.status(400).send({
      message: "This route is not for password updates. Please use /update-password.",
    });
  }
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'fullname', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
  
    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  };

  export const deleteMe = async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
  
    res.status(204).json({
      status: 'success',
      data: null
    });
  };
  

export const updateUser = async (req, res) => {
  const user = await User.findOneAndUpdate(req.params.username, req.body, {
    new: true,
    runValidators: true,
  });
  if (user) {
    res.status(200).send(user);
  } else {
    res.status(404).send({ message: 'User not found' });
  }
};
