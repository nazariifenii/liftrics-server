const mongoose = require("mongoose");
const validator = require("validator");
const _ = require("lodash");

const OrderSchema = new mongoose.Schema(
  {
    primaryStreet: {
      type: String,
      required: true,
      trim: true
    },
    destinationStreet: {
      type: String,
      required: true,
      trim: true
    },
    primaryCity: {
      type: String,
      trim: true
    },
    destinationCity: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      required: false,
      trim: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      // required: true,
      ref: "User"
    },
    status: {
      type: String
    },
    image: {
      type: Buffer
    },
    imageUrl: {
      type: String
    },
    packageSize: {
      type: String
    },
    packageWeight: {
      type: String
    },
    applicantslist: [mongoose.Schema.Types.ObjectId]
  },
  {
    timestamps: true
  }
);

OrderSchema.methods.toJSON = function() {
  const order = this;
  const orderObject = order.toObject();
  delete orderObject.image;

  return orderObject;
};

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
