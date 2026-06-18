import React, { useState } from "react";
import MessageFormUI from "./MessageFormUI";

const Ai = ({ props, activeChat }) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [streamingText, setStreamingText] = useState("");

  const handleChange = (e) => setMessage(e.target.value);

  const handleSubmit = async () => {
    const date = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", `${Math.floor(Math.random() * 1000)}+00:00`);
    const at = attachment ? [{ blob: attachment, file: attachment.name }] : [];
    const form = {
      attachments: at,
      created: date,
      sender_username: props.username,
      text: message,
      activeChatId: activeChat.id,
    };

    props.onSubmit(form);
    setMessage("");
    setAttachment("");

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}openai/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      console.error("Failed to fetch streaming response");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            botMessage += data.text;
            setStreamingText(botMessage);
          } catch (e) {
            // ignore parse errors for partial chunks
          }
        }
      }
    }
    setStreamingText("");
  };

  return (
    <MessageFormUI
      setAttachment={setAttachment}
      message={message}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      streamingText={streamingText}
    />
  );
};

export default Ai;