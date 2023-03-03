const express = require("express");
const _ = require("lodash");
const sharp = require("sharp");
const multer = require("multer");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = new express.Router();
const Order = require("../models/order");

// POST users
// Used for registering users
router.post("/users", async (req, res) => {
  const body = _.pick(req.body, [
    "firstName",
    "lastName",
    "phoneNumber",
    "password"
  ]);
  const user = new User(body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// POST /users/login {phoneNumber, password}
// Login into app
router.post("/users/login", async (req, res) => {
  const body = _.pick(req.body, ["phoneNumber", "password"]);
  try {
    const user = await User.findByCredentials(body.phoneNumber, body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.get("/users/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["firstName", "lastName", "email", "password"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid parameters" });
  }
  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/users/me/token", auth, (req, res) => {
  req.user.removeToken(req.token).then(
    () => {
      res.status(200).send();
    },
    () => {
      res.status(400).send();
    }
  );
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please, upload an image"));
    }

    cb(undefined, true);
  }
});

// Creates and updates avatar
router.post(
  "/users/me/profile-pic",
  auth,
  upload.single("profile-pic"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 350, height: 350 })
      .png()
      .toBuffer();
    req.user.image = buffer;
    req.user.imageUrl =
      req.protocol +
      "://" +
      req.get("host") +
      req.originalUrl.replace("me", req.user.id);

    await req.user.save();
    res.send(req.user);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/profile-pic", auth, async (req, res) => {
  req.user.image = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/profile-pic", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.image) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.image);
  } catch (error) {
    res.status(404).send();
  }
});

router.post("/users/leaveFeedback/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const order = await Order.findOne({
      _id: req.body.orderId
    });
    if (order.status === "Closed") {
      return res.status(404).send({ error: "This order already closed" });
    }
    user.ratingsList = user.ratingsList.concat(req.body.leftRating);
    user.userTotalRating = _.meanBy(user.ratingsList, p => Number(p));
    order.status = "Closed";
    await user.save();
    await order.save();
    res.send(order);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
