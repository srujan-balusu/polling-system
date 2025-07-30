import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import socket from "../../socket"; // Adjust path if needed
import backIcon from "../../assets/back.svg";

const PollHistoryPage = () => {
  const [polls, setPolls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Request polls from server via socket.io
    socket.emit("get_polls");
    const handler = (polls) => setPolls(polls);
    socket.on("polls-list", handler);

    // Live poll create/end updates, for real-time
    socket.on("poll-created", poll => setPolls(prev => [poll, ...prev]));
    socket.on("poll-ended", pollId =>
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isActive: false } : p))
    );

    return () => {
      socket.off("polls-list", handler);
      socket.off("poll-created");
      socket.off("poll-ended");
    };
  }, []);

  const calculatePercentage = (count, totalVotes) =>
    totalVotes === 0 ? 0 : (count / totalVotes) * 100;

  const handleBack = () => {
    navigate("/teacher-home-page");
  };

  return (
    <div className="container mt-5 w-50">
      <div className="mb-4 text-left">
        <img
          src={backIcon}
          alt=""
          width={"25px"}
          style={{ cursor: "pointer" }}
          onClick={handleBack}
        />{" "}
        View <b>Poll History</b>
      </div>

      {/* CSV export removed: not possible in-memory */}

      {polls.length > 0 ? (
        polls.map((poll, idx) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
          return (
            <div key={poll.id} className="card mb-4">
              <div className="card-body">
                <h6 className="question py-2 ps-2 text-left rounded text-white">
                  {`Q${idx + 1}: ${poll.question}`}
                </h6>
                <div className="list-group mt-4">
                  {poll.options.map((option, i) => (
                    <div key={i} className="list-group-item rounded m-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{option.text}</span>
                        <span>
                          {Math.round(calculatePercentage(option.votes, totalVotes))}%
                        </span>
                      </div>
                      <div className="progress mt-2">
                        <div
                          className="progress-bar progress-bar-bg"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(option.votes, totalVotes)}%`,
                          }}
                          aria-valuenow={option.votes}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "12px" }}>
                  {poll.isActive ? "Active" : "Ended"} | Duration: {poll.duration}s | {new Date(poll.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-muted">No polls found.</div>
      )}
    </div>
  );
};

export default PollHistoryPage;
