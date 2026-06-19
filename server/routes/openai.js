import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { openai } from "../index.js";

dotenv.config();
const router = express.Router();

router.post("/text", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    // Fetch conversation history from ChatEngine
    const chatEngineResponse = await axios.get(
      `https://api.chatengine.io/chats/${activeChatId}/messages/`,
      {
        headers: {
          "Project-ID": process.env.PROJECT_ID,
          "User-Name": process.env.BOT_USER_NAME,
          "User-Secret": process.env.BOT_USER_SECRET,
        },
      }
    );

    const messages = chatEngineResponse.data
      .map((msg) => ({
        role: msg.sender_username === process.env.BOT_USER_NAME ? "assistant" : "user",
        content: msg.text,
      }))
      .slice(-10); // Last 10 messages for context

    messages.push({ role: "user", content: text });

    const response = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.5,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
        stream: true,
      },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let botResponse = "";
    response.data.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "");
      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          // Final complete response can be sent to ChatEngine
          axios
            .post(
              `https://api.chatengine.io/chats/${activeChatId}/messages/`,
              { text: botResponse },
              {
                headers: {
                  "Project-ID": process.env.PROJECT_ID,
                  "User-Name": process.env.BOT_USER_NAME,
                  "User-Secret": process.env.BOT_USER_SECRET,
                },
              }
            )
            .catch((err) => console.error("ChatEngine Error:", err.message));
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices[0].delta?.content;
          if (content) {
            botResponse += content;
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
          }
        } catch (error) {
          console.error("Could not JSON parse stream message", message, error);
        }
      }
    });
  } catch (error) {
    console.error("error", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/code", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    // Fetch conversation history from ChatEngine
    const chatEngineResponse = await axios.get(
      `https://api.chatengine.io/chats/${activeChatId}/messages/`,
      {
        headers: {
          "Project-ID": process.env.PROJECT_ID,
          "User-Name": process.env.BOT_USER_NAME,
          "User-Secret": process.env.BOT_USER_SECRET,
        },
      }
    );

    const messages = chatEngineResponse.data
      .map((msg) => ({
        role: msg.sender_username === process.env.BOT_USER_NAME ? "assistant" : "user",
        content: msg.text,
      }))
      .slice(-10);

    messages.push({
      role: "system",
      content: "You are a helpful assistant that writes code.",
    });
    messages.push({ role: "user", content: text });

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const botResponse = response.data.choices[0].message.content;

    await axios.post(
      `https://api.chatengine.io/chats/${activeChatId}/messages/`,
      { text: botResponse },
      {
        headers: {
          "Project-ID": process.env.PROJECT_ID,
          "User-Name": process.env.BOT_USER_NAME,
          "User-Secret": process.env.BOT_USER_SECRET,
        },
      }
    );

    res.status(200).json({ text: botResponse });
  } catch (error) {
    console.error("error", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/assist", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Finish my thought: ${text}`,
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    res.status(200).json({ text: response.data.choices[0].text });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;