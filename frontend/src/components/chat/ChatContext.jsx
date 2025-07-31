import React, { createContext, useState, useEffect } from "react";
import socket from "../../socket"; // path based on your structure

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const receiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("chat-message", receiveMessage);
    return () => socket.off("chat-message", receiveMessage);
  }, []);

  const sendMessage = (msg) => {
    socket.emit("send-chat-message", msg);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};