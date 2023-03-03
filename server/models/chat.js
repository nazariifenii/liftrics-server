const mongoose = require("mongoose");
const validator = require("validator");

const ChatSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    messages: [
      {
        text: {
          type: String,
          trim: true
        },
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

ChatSchema.methods.toJSON = function() {
  const chat = this;
  const chatObject = chat.toObject();

  return chatObject;
};

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
