import React, { useState, useEffect, useRef } from "react";
import { Button, Popover, OverlayTrigger, Tab, Nav } from "react-bootstrap";
import socket from "../../socket"; // Use shared socket
import "./Chat.css";
import chatIcon from "../../assets/chat.svg";

const ChatPopover = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [tabKey, setTabKey] = useState("chat");
  const chatWindowRef = useRef(null);
  const username = sessionStorage.getItem("username") || "Guest";
  const role = username.startsWith("teacher") ? "teacher" : "student";

  useEffect(() => {
    // Announce join
    socket.emit("join-chat", { username });

    // Listen for chat messages
    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => chatWindowRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    // Listen for participants update
    socket.on("participants-update", (list) => setParticipants(list));

    // Listen for kick out (if backend sends 'kicked')
    socket.on("kicked", () => {
      alert("You have been kicked out by the teacher.");
      sessionStorage.removeItem("username");
      window.location.href = "/";
    });

    return () => {
      socket.off("chat-message");
      socket.off("participants-update");
      socket.off("kicked");
    };
  }, [username]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const msg = {
        username,
        message: newMessage,
        role,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit("chat-message", msg);
      setNewMessage("");
    }
  };

  const handleKickOut = (participant) => {
    socket.emit("kick-student", participant);
  };

  const participantsTab = (
    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
      {participants.length === 0 ? (
        <div>No participants connected</div>
      ) : (
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              {role === "teacher" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => (
              <tr key={idx}>
                <td>{p}</td>
                {role === "teacher" && (
                  <td>
                    <button
                      style={{ fontSize: "10px" }}
                      onClick={() => handleKickOut(p)}
                      className="btn btn-link text-danger"
                    >
                      Kick Out
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const popover = (
    <Popover id="chat-popover" style={{ width: "370px", fontSize: "12px" }}>
      <Popover.Body style={{ height: "370px" }}>
        <Tab.Container activeKey={tabKey} onSelect={setTabKey}>
          <Nav variant="underline">
            <Nav.Item>
              <Nav.Link eventKey="chat">Chat</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="participants">Participants</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content className="mt-2">
            <Tab.Pane eventKey="chat">
              <div
                style={{
                  maxHeight: "230px",
                  overflowY: "auto",
                  background: "#f7f7fa",
                  padding: 8,
                  marginBottom: 8,
                  borderRadius: 6,
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: msg.role === "teacher" ? "right" : "left",
                      margin: "4px 0",
                    }}
                  >
                    <span style={{
                      fontWeight: "bold",
                      color: msg.role === "teacher" ? "#007bff" : "#28a745"
                    }}>
                      {msg.username}:
                    </span>{" "}
                    {msg.message}
                    <span style={{ fontSize: "0.8em", color: "#888", marginLeft: 6 }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                <div ref={chatWindowRef}></div>
              </div>
              <div className="d-flex">
                <input
                  className="form-control"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                  style={{ fontSize: "12px" }}
                />
                <Button className="ms-2" size="sm" onClick={handleSendMessage}>
                  Send
                </Button>
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey="participants">{participantsTab}</Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="left" overlay={popover} rootClose>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "10px",
          background: "rgba(90, 102, 209, 1)",
          borderRadius: "100%",
          cursor: "pointer",
          zIndex: 2000,
        }}
      >
        <img
          style={{ width: "30px", height: "30px" }}
          src={chatIcon}
          alt="chat icon"
        />
      </div>
    </OverlayTrigger>
  );
};

export default ChatPopover;
