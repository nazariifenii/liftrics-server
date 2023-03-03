const express = require("express");
const sharp = require("sharp");
const multer = require("multer");
const Order = require("../models/order");
const auth = require("../middleware/auth");
ObjectId = require("mongodb").ObjectID;

const router = new express.Router();

router.post("/orders", auth, async (req, res) => {
  const order = new Order({
    ...req.body,
    creator: req.user._id,
    status: "New"
  });

  try {
    await order.save();
    res.status(201).send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// GET /orders?creatorId=id
// GET /orders?driverID=id
router.get("/orders", auth, async (req, res) => {
  const match = {};

  if (req.query.creatorId) {
    match.creator = req.query.creatorId;
  } else if (req.query.driverId) {
    match.driverId = req.query.driverId;
  } else if (req.query.packageSize) {
    const packageSize = JSON.parse(req.query.packageSize);
    match.packageSize = { $in: packageSize };
  } else if (req.query.packageWeight) {
    const packageWeight = JSON.parse(req.query.packageWeight);
    match.packageWeight = { $in: packageWeight };
  }

  try {
    const orders = await Order.find(match).sort({ createdAt: -1 });
    res.send(orders);
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/orders/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const order = await Order.findOne({ _id, creator: req.user._id });

    if (!order) {
      return res.status(404).send();
    }
    res.send(order);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch("/orders/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["comment"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!order) {
      return res.status(404).send();
    }

    updates.forEach(update => (order[update] = req.body[update]));
    await order.save();
    res.send(order);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/orders/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!order) {
      return res.status(404).send();
    }

    res.send(order);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch("/orders/apply/:id", auth, async (req, res) => {
  const driverId = req.body.driverId;
  if (!driverId) {
    return res.status(400).send({ error: "Invalid body!" });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.id
    });

    if (!order || ObjectId(order.creator).toString() === driverId) {
      return res.status(404).send({ error: "Order not found!" });
    }

    if (order.applicantslist.indexOf(driverId) > -1) {
      return res.send(order);
    }

    order.applicantslist = [driverId, ...order.applicantslist];
    await order.save();
    res.send(order);
  } catch (error) {
    res.status(500).send({ error });
  }
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

router.post(
  "/orders/:id/order-pic",
  auth,
  upload.single("order-pic"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 350, height: 350 })
      .png()
      .toBuffer();
    const order = await Order.findOne({
      _id: req.params.id
    });
    order.image = buffer;
    order.imageUrl =
      req.protocol +
      "://" +
      req.get("host") +
      req.originalUrl.replace(":id", order.id);

    await order.save();
    res.send(order);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get("/orders/:id/order-pic", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || !order.image) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(order.image);
  } catch (error) {
    res.status(404).send();
  }
});

router.patch("/orders/submitDriver/:id", auth, async (req, res) => {
  const driverId = req.body.driverId;
  if (!driverId) {
    return res.status(400).send({ error: "Invalid body!" });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.id
    });

    if (!order || ObjectId(order.creator).toString() === driverId) {
      return res.status(404).send({ error: "Order not found!" });
    } else if (order.driverId) {
      return res.status(404).send({ error: "Order already have a driver" });
    } else if (order.applicantslist.indexOf(driverId) === -1) {
      return res.status(404).send({ error: "User is not in applicants list!" });
    }
    order.status = "In Progress";
    order.driverId = driverId;
    await order.save();
    res.send(order);
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/orders/finishOrder/:id", auth, async (req, res) => {
  const driverId = req.body.driverId;
  if (!driverId) {
    return res.status(400).send({ error: "Invalid body!" });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.id
    });

    if (!order || ObjectId(order.creator).toString() === driverId) {
      return res.status(404).send({ error: "Order not found!" });
    } else if (order.applicantslist.indexOf(driverId) === -1) {
      return res.status(404).send({ error: "User is not in applicants list!" });
    }

    order.status = "Finished";
    await order.save();
    res.send(order);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
