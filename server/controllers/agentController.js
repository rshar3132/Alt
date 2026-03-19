import Groq from "groq-sdk";
import * as duffel_fServices from "../services/duffel_fServices.js";
import * as seatService from "../services/seatService.js";
import Booking from "../models/Booking.js";
import { tools } from "../utils/agentTools.js";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY }); // uses GROQ_API_KEY from .env

export const handleAgentMessage = async (req, res) => {
  const { messages } = req.body; // full conversation history from frontend
  const userId = req.user._id;

  try {
    let response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful flight booking assistant. You help users search flights, make bookings, and manage their travel. Always confirm details before booking.",
        },
        ...messages,
      ],
      tools: tools,
      tool_choice: "auto",
    });

    while (response.choices[0].finish_reason === "tool_calls") {
      const toolCall = response.choices[0].message.tool_calls[0];
      const toolResult = await executeTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments), // ✅ Groq returns arguments as a JSON string
        userId
      );

      messages.push(response.choices[0].message); // push assistant message with tool_calls
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });

      response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful flight booking assistant...",
          },
          ...messages,
        ],
        tools: tools,
        tool_choice: "auto",
      });
    }

    // Final text response
    res.json({
      reply: response.choices[0].message.content,
      messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Agent error",
      message: err.message,
      stack: err.stack
     });
  }
};

// Tool execution — maps tool names to your existing services
const executeTool = async (toolName, input, userId) => {
  switch (toolName) {
    case "search_flights":
      return await duffel_fServices.searchFlightsDuffel(input); // your existing Duffel call

    case "get_user_bookings":
      return await Booking.find({ userId }).lean();

    case "book_ticket":
      return await seatService.createFullBooking({ ...input, userId });

    case "cancel_booking":
      return await Booking.findOneAndDelete({ _id: input.bookingId, userId });

    default:
      return { error: "Unknown tool" };
  }
};
