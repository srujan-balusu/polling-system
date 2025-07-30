import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import socket from "../../socket";
import ChatPopover from "../../components/chat/ChatPopover";
import { useNavigate } from "react-router-dom";
import eyeIcon from "../../assets/eye.svg";

const TeacherPollPage = () => {
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([]);
  const [votes, setVotes] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Poll created event
    const pollCreatedHandler = (pollData) => {
      setPollQuestion(pollData.question);
      setPollOptions(
        pollData.options.map((opt, index) => ({ id: index, text: opt.text || opt }))
      );
      setVotes({});
      setTotalVotes(0);
    };

    // Voting event
    const voteReceivedHandler = ({ pollId, votes: voteArray }) => {
      const updatedVotes = {};
      pollOptions.forEach((opt, idx) => {
        updatedVotes[opt.text] = voteArray[idx] || 0;
      });
      setVotes(updatedVotes);
      setTotalVotes(voteArray.reduce((a, b) => a + b, 0));
    };

    // Student list event
    const studentListHandler = (list) => setStudents(list);

    // Poll ended event
    const pollEndedHandler = () => {
      setPollQuestion("");
      setPollOptions([]);
      setVotes({});
      setTotalVotes(0);
    };

    socket.on("poll-created", pollCreatedHandler);
    socket.on("vote-received", voteReceivedHandler);
    socket.on("student-list", studentListHandler);
    socket.on("poll-ended", pollEndedHandler);

    return () => {
      socket.off("poll-created", pollCreatedHandler);
      socket.off("vote-received", voteReceivedHandler);
      socket.off("student-list", studentListHandler);
      socket.off("poll-ended", pollEndedHandler);
    };
    // eslint-disable-next-line
  }, [pollOptions]);

  const calculatePercentage = (count) => {
    if (totalVotes === 0) return 0;
    return (count / totalVotes) * 100;
  };

  const handleViewPollHistory = () => {
    navigate("/teacher-poll-history");
  };

  // Poll creation - now simply navigates to the poll creation page
  const createPoll = () => {
  console.log("Create Poll clicked");
  socket.off("can-create-poll-ok");
  socket.off("poll-create-error");

  socket.once("can-create-poll-ok", () => {
    console.log("Poll check passed");
    navigate("/teacher-home-page");
  });

  socket.once("poll-create-error", (errorMessage) => {
    console.log("Poll check failed:", errorMessage);
    alert(errorMessage);
  });

  socket.emit("check-can-create-poll");
};

  // Kick student by name
  const handleKickByName = (name) => {
    socket.emit("kick-student", name);
  };

  return (
    <>
      <div className="container mt-5 w-50">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn rounded-pill ask-question poll-history px-4"
            onClick={handleViewPollHistory}
          >
            <img src={eyeIcon} alt="view" />
            &nbsp; View Poll History
          </button>
          <button
            className="btn btn-success rounded-pill px-4"
            onClick={createPoll}
          >
            + Create New Poll
          </button>
        </div>

        {/* Active Students with Kick by Name */}
        <div className="mb-3">
          <h5>Active Students</h5>
          <ul className="list-group">
            {students.map((stu) => (
              <li className="list-group-item d-flex justify-content-between align-items-center" key={stu.socketId}>
                {stu.name}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleKickByName(stu.name)}
                >
                  Kick
                </button>
              </li>
            ))}
            {students.length === 0 && <li className="list-group-item">No students connected</li>}
          </ul>
        </div>

        <h3 className="mb-4 text-center">Poll Results</h3>
        {pollQuestion ? (
          <>
            <div className="card">
              <div className="card-body">
                <h6 className="question py-2 ps-2 text-left rounded text-white">
                  {pollQuestion} ?
                </h6>
                <div className="list-group mt-4">
                  {pollOptions.map((option) => (
                    <div key={option.id} className="list-group-item rounded m-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{option.text}</span>
                        <span>
                          {Math.round(calculatePercentage(votes[option.text] || 0))}%
                        </span>
                      </div>
                      <div className="progress mt-2">
                        <div
                          className="progress-bar progress-bar-bg"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(
                              votes[option.text] || 0
                            )}%`,
                          }}
                          aria-valuenow={votes[option.text] || 0}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                className="btn rounded-pill ask-question px-4 m-3"
                onClick={createPoll}
              >
                + Ask a new question
              </button>
            </div>
          </>
        ) : (
          <div className="text-muted text-center mt-5">
            Waiting for the teacher to start a new poll...
          </div>
        )}
      </div>
      <ChatPopover />
    </>
  );
};

export default TeacherPollPage;
