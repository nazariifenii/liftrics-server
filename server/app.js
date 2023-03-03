const express = require("express");
require("./db/mongoose");

const userRouter = require("./routes/user");
const orderRouter = require("./routes/order");
const chatRouter = require("./routes/chat");

const app = express();
app.use(express.json());
app.use(userRouter);
app.use(orderRouter);
app.use(chatRouter);

const server = require("http").createServer(app);
const io = require("socket.io").listen(server);

io.on("connection", function(socket) {
  socket.on("chat message", message => {
    io.emit("chat message", message);
  });

  //   socket.on("subscribe", function(room) {
  //     console.log("joining room", room);
  //     socket.join(room);
  //   });

  //   socket.on("unsubscribe", function(room) {
  //     console.log("leaving room", room);
  //     socket.leave(room);
  //   });

  //   socket.on("send", function(data) {
  //     console.log("sending message", data);
  //     io.sockets.in(data.room).emit("message", data);
  //   });
});

module.exports = { server, io };
