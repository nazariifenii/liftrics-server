const express = require("express");
const _ = require("lodash");
const auth = require("../middleware/auth");
const Chat = require("../models/chat");
// const io  = require("../app");
const router = new express.Router();

router.post("/chats", async (req, res) => {
  const body = _.pick(req.body, ["driverId", "customerId"]);
  const chat = new Chat(body);

  try {
    await chat.save();
    res.status(201).send(chat);
  } catch (e) {
    res.status(400).send(e);
  }
});

// router.post("/send/:room", (req, res) => {
//   const room = req.params.room;
//   message = req.body;

//   io.sockets.in(room).emit("message", { room: room, message: message });

//   res.end("message sent");
// });

module.exports = router;
