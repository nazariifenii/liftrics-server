const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const Order = require("./order");

const saltForHash = process.env.JWT_SECRET;

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      minlength: 12,
      unique: true,
      validate: {
        validator: validator.isMobilePhone,
        message: "{VALUE} is not a valid phone number"
      }
    },
    email: {
      type: String,
      trim: true,
      minlength: 1,
      // unique: true, // Since it is not at login page
      validate: {
        validator: validator.isEmail,
        message: "{VALUE} is not a valid email"
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'");
        }
      }
    },
    imageUrl: {
      type: String
    },
    ratingsList: [String],
    userTotalRating: {
      type: String
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    image: {
      type: Buffer
    }
  },
  { timestamps: true }
);

UserSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "creator"
});

UserSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "driver"
});

UserSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.image;

  return userObject;
};

UserSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, saltForHash);

  user.tokens = user.tokens.concat({ token });

  await user.save();

  return token;
};

UserSchema.statics.findByCredentials = async (phoneNumber, password) => {
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new Error("This user was not found!");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Phone number and password does not match!");
  }

  return user;
};

// Hash the plain text password before saving
UserSchema.pre("save", function(next) {
  const user = this;

  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

UserSchema.pre("remove", async function(next) {
  const user = this;
  await Order.deleteMany({ creator: user._id });
  next();
});
var User = mongoose.model("User", UserSchema);

module.exports = User;
