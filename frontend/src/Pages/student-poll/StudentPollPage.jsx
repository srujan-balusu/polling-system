import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import socket from "../../socket";
import "./StudentPollPage.css";
import stopwatch from "../../assets/stopwatch.svg";
import ChatPopover from "../../components/chat/ChatPopover";
import { useNavigate } from "react-router-dom";
import stars from "../../assets/spark.svg";

const StudentPollPage = () => {
  const [votes, setVotes] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([]);
  const [pollId, setPollId] = useState("");
  const [kickedOut, setKickedOut] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleOptionSelect = (option) => setSelectedOption(option);

  const handleSubmit = () => {
    if (selectedOption) {
      const username = sessionStorage.getItem("username");
      if (username) {
        socket.emit("vote", {
          pollId,
          optionIndex: pollOptions.findIndex((opt) => opt.text === selectedOption),
        });
        setSubmitted(true);
      }
    }
  };

  useEffect(() => {
    socket.on("kicked", () => {
      setKickedOut(true);
      sessionStorage.removeItem("username");
      navigate("/kicked-out");
    });
    return () => socket.off("kicked");
  }, [navigate]);

  useEffect(() => {
    const username = sessionStorage.getItem("username");

    const pollCreatedHandler = (pollData) => {
      setPollQuestion(pollData.question);
      setPollOptions(
        pollData.options.map((opt, index) => ({
          id: index,
          text: opt.text || opt
        }))
      );
      setVotes({});
      setSubmitted(false);
      setSelectedOption(null);
      setTimeLeft(pollData.duration);
      const pid = pollData._id || pollData.id;
      setPollId(pid);

      if (username && pid) {
        socket.emit("student-join", { name: username, pollId: pid });
      }
    };

    const voteReceivedHandler = ({ pollId: votedPollId, votes: votesArr }) => {
      if (votedPollId === pollId) {
        const updatedVotes = {};
        pollOptions.forEach((opt, idx) => {
          updatedVotes[opt.text] = votesArr[idx] || 0;
        });
        setVotes(updatedVotes);
      }
    };

    const pollEndedHandler = () => {
      setSubmitted(true);
      setTimeLeft(0);
    };

    socket.on("poll-created", pollCreatedHandler);
    socket.on("vote-received", voteReceivedHandler);
    socket.on("poll-ended", pollEndedHandler);

    return () => {
      socket.off("poll-created", pollCreatedHandler);
      socket.off("vote-received", voteReceivedHandler);
      socket.off("poll-ended", pollEndedHandler);
    };
  }, [pollId, pollOptions]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setSubmitted(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, submitted]);

  const calculatePercentage = (count) =>
    totalVotes === 0 ? 0 : (count / totalVotes) * 100;

  return (
    <>
      <ChatPopover />
      {kickedOut ? (
        <div className="text-center mt-5"><h2>You have been kicked.</h2></div>
      ) : (
        <>
          {pollQuestion === "" && timeLeft === 0 && (
            <div className="d-flex justify-content-center align-items-center vh-100 w-75 mx-auto">
              <div className="student-landing-container text-center">
                <button className="btn btn-sm intervue-btn mb-5">
                  <img src={stars} className="px-1" alt="" />
                  Intervue Poll
                </button>
                <div className="spinner-border text-center spinner" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="landing-title">
                  <b>Wait for the teacher to ask questions..</b>
                </h3>
              </div>
            </div>
          )}
          {pollQuestion !== "" && (
            <div className="container mt-5 w-50">
              <div className="d-flex align-items-center mb-4">
                <h5 className="m-0 pe-5">Question</h5>
                <img src={stopwatch} width="15px" alt="Stopwatch" />
                <span className="ps-2 ml-2 text-danger">{timeLeft}s</span>
              </div>
              <div className="card">
                <div className="card-body">
                  <h6 className="question py-2 ps-2 float-left rounded text-white">
                    {pollQuestion}?
                  </h6>
                  <div className="list-group mt-4">
                    {pollOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`list-group-item rounded m-1 ${
                          selectedOption === option.text ? "border option-border" : ""
                        }`}
                        style={{
                          padding: "10px",
                          cursor: submitted || timeLeft === 0 ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (!submitted && timeLeft > 0) {
                            handleOptionSelect(option.text);
                          }
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className={`ml-2 text-left ${
                              submitted ? "font-weight-bold" : ""
                            }`}
                          >
                            {option.text}
                          </span>
                          {submitted && (
                            <span className="text-right">
                              {Math.round(
                                calculatePercentage(votes[option.text] || 0)
                              )}%
                            </span>
                          )}
                        </div>
                        {submitted && (
                          <div className="progress mt-2">
                            <div
                              className="progress-bar progress-bar-bg"
                              role="progressbar"
                              style={{
                                width: `${calculatePercentage(votes[option.text] || 0)}%`,
                              }}
                              aria-valuenow={votes[option.text] || 0}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {!submitted && selectedOption && timeLeft > 0 && (
                <div className="d-flex justify-content-end align-items-center">
                  <button
                    type="submit"
                    className="btn continue-btn my-3 w-25"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              )}
              {submitted && (
                <div className="mt-5">
                  <h6 className="text-center">
                    Wait for the teacher to ask a new question...
                  </h6>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default StudentPollPage;