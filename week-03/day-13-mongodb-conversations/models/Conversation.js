import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    // Only set on assistant messages: how many tokens this reply used
    outputTokens: Number,
  },
  { timestamps: true },
);

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "New chat" },
    messages: [messageSchema],
  },
  { timestamps: true },
);

export default mongoose.model("Conversation", conversationSchema);
