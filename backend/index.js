const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ✅ Updated frontend URL
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://polling-system-3-gsxu.onrender.com"
        : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

let polls = [];
let connectedStudents = {};
let chatParticipants = new Set();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("check-can-create-poll", () => {
    const activePoll = polls.find(p => p.isActive);
    if (activePoll) {
      const allAnswered = Object.values(connectedStudents).every(stu =>
        Object.keys(activePoll.responses || {}).includes(stu.name)
      );
      if (!allAnswered && Object.keys(connectedStudents).length > 0) {
        socket.emit(
          "poll-create-error",
          "Cannot start a new poll until all students have answered the previous poll."
        );
      } else {
        socket.emit(
          "poll-create-error",
          "A poll is already active. Please wait for it to finish before starting a new one."
        );
      }
    } else {
      socket.emit("can-create-poll-ok");
    }
  });

  socket.on("create_poll", ({ question, options, duration }) => {
    const poll = {
      id: Date.now().toString(),
      question,
      options: options.map(text => ({ text, votes: 0 })),
      duration,
      isActive: true,
      createdAt: new Date(),
      responses: {}
    };
    polls.unshift(poll);
    io.emit("poll-created", poll);

    setTimeout(() => {
      if (poll.isActive) {
        poll.isActive = false;
        io.emit("poll-ended", poll.id);
      }
    }, duration * 1000);
  });

  socket.on("student-join", ({ name }) => {
    connectedStudents[socket.id] = { name };
    io.emit("student-list", Object.entries(connectedStudents).map(([sid, info]) => ({
      socketId: sid,
      ...info
    })));
  });

  socket.on("kick-student", (studentName) => {
    Object.entries(connectedStudents).forEach(([sid, info]) => {
      if (info.name === studentName) {
        io.to(sid).emit("kicked");
        delete connectedStudents[sid];
      }
    });
    io.emit("student-list", Object.entries(connectedStudents).map(([sid, info]) => ({
      socketId: sid,
      ...info
    })));
  });

  socket.on("vote", ({ pollId, optionIndex }) => {
    const poll = polls.find(p => p.id === pollId && p.isActive);
    if (poll && poll.options[optionIndex]) {
      poll.options[optionIndex].votes += 1;
      const studentName = connectedStudents[socket.id]?.name || "Unknown";
      if (!poll.responses) poll.responses = {};
      poll.responses[studentName] = optionIndex;

      io.emit("vote-received", {
        pollId,
        votes: poll.options.map(o => o.votes),
        responses: poll.responses
      });
    }
  });

  socket.on("end-poll", (pollId) => {
    const poll = polls.find(p => p.id === pollId);
    if (poll && poll.isActive) {
      poll.isActive = false;
      io.emit("poll-ended", pollId);
    }
  });

  socket.on("get_polls", () => {
    socket.emit("polls-list", polls);
  });

  socket.on("join-chat", ({ username }) => {
    socket.username = username;
    chatParticipants.add(username);
    io.emit("participants-update", Array.from(chatParticipants));
  });

  socket.on("chat-message", (msgObj) => {
    io.emit("chat-message", msgObj);
  });

  socket.on("disconnect", () => {
    if (connectedStudents[socket.id]) {
      delete connectedStudents[socket.id];
      io.emit("student-list", Object.entries(connectedStudents).map(([sid, info]) => ({
        socketId: sid,
        ...info
      })));
    }
    if (socket.username) {
      chatParticipants.delete(socket.username);
      io.emit("participants-update", Array.from(chatParticipants));
    }
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
