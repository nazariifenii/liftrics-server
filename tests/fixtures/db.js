const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../server/models/user");
const Order = require("../../server/models/order");

const testUserId = new mongoose.Types.ObjectId();
const testUser = {
  _id: testUserId,
  firstName: "Alex",
  lastName: "Test",
  phoneNumber: "+380958167673",
  password: "test123",
  tokens: [
    {
      token: jwt.sign({ _id: testUserId }, process.env.JWT_SECRET)
    }
  ]
};

const configureDatabase = async () => {
  await User.deleteMany();
  await new User(testUser).save();
};

module.exports = {
  testUserId,
  testUser,
  configureDatabase
};
