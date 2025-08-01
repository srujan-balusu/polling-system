import React, { useState, useEffect } from "react";
import stars from "../../assets/spark.svg";
import "./TeacherLandingPage.css";
import socket from "../../socket";
import { useNavigate } from "react-router-dom";
import eyeIcon from "../../assets/eye.svg";
import ChatPopover from "../../components/chat/ChatPopover"; // Add chat

const TeacherLandingPage = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ id: 1, text: "", correct: null }]);
  const [timer, setTimer] = useState("60");
  const [error, setError] = useState("");
  const [pollCreateError, setPollCreateError] = useState("");
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    socket.on("poll-create-error", (msg) => {
      setPollCreateError(msg);
      setTimeout(() => setPollCreateError(""), 3500);
    });
    return () => socket.off("poll-create-error");
  }, []);

  const handleQuestionChange = (e) => setQuestion(e.target.value);
  const handleTimerChange = (e) => setTimer(e.target.value);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index].text = value;
    setOptions(updatedOptions);
  };

  const handleCorrectToggle = (index, isCorrect) => {
    const updatedOptions = [...options];
    updatedOptions[index].correct = isCorrect;
    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([
      ...options,
      { id: options.length + 1, text: "", correct: null },
    ]);
  };

  const validateForm = () => {
    if (question.trim() === "") {
      setError("Question cannot be empty");
      return false;
    }
    if (options.length < 2) {
      setError("At least two options are required");
      return false;
    }
    const optionTexts = options.map((option) => option.text.trim());
    if (optionTexts.some((text) => text === "")) {
      setError("All options must have text");
      return false;
    }
    const correctOptionExists = options.some(
      (option) => option.correct === true
    );
    if (!correctOptionExists) {
      setError("At least one correct option must be selected");
      return false;
    }
    setError("");
    return true;
  };

  const askQuestion = () => {
    if (validateForm()) {
      const duration = Number(timer);
      const validDuration = isNaN(duration) || duration <= 0 ? 60 : duration;
      const pollData = {
        question,
        options: options.map((o) => o.text),
        duration: validDuration,
      };
      socket.emit("create_poll", pollData);
      navigate("/teacher-poll");
    }
  };

  const handleViewPollHistory = () => {
    navigate("/teacher-poll-history");
  };

  return (
    <>
      <ChatPopover /> {/* Add chat */}
      <button
        className="btn rounded-pill ask-question px-4 m-2"
        onClick={handleViewPollHistory}
      >
        <img src={eyeIcon} alt="" />
        View Poll history
      </button>

      <div className="container my-4 w-75 ms-5">
        <button className="btn btn-sm intervue-btn mb-3">
          <img src={stars} alt="Poll Icon" /> Intervue Poll
        </button>
        <h2 className="fw-bold">
          Let's <strong>Get Started</strong>
        </h2>
        <p>
          <b>Teacher: </b>
          {username}
        </p>
        <p className="text-muted">
          You'll have the ability to create and manage polls, ask questions, and
          monitor your students' responses in real-time.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {pollCreateError && (
          <div className="alert alert-warning">{pollCreateError}</div>
        )}

        <div className="mb-4">
          <div className="d-flex justify-content-between pb-3">
            <label htmlFor="question" className="form-label">
              Enter your question
            </label>
            <input
              type="number"
              min="1"
              className="form-control w-auto ms-3"
              value={timer}
              onChange={handleTimerChange}
              placeholder="Duration (sec)"
            />
          </div>
          <input
            type="text"
            id="question"
            className="form-control"
            onChange={handleQuestionChange}
            rows="3"
            maxLength="100"
            placeholder="Type your question..."
          />
          <div className="text-end text-muted mt-1">{question.length}/100</div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between pb-3">
            <label className="form-label">Edit Options</label>
            <label className="form-label">Is it correct?</label>
          </div>
          {options.map((option, index) => (
            <div key={option.id} className="d-flex align-items-center mb-2">
              <span className="me-3 sNo">{index + 1}</span>
              <input
                type="text"
                className="form-control me-3 option-input"
                placeholder="Option text..."
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`correct-${index}`}
                  checked={option.correct === true}
                  onChange={() => handleCorrectToggle(index, true)}
                  required
                />
                <label className="form-check-label">Yes</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`correct-${index}`}
                  checked={option.correct === false}
                  onChange={() => handleCorrectToggle(index, false)}
                  required
                />
                <label className="form-check-label">No</label>
              </div>
            </div>
          ))}
        </div>

        <button className="btn add-options" onClick={addOption}>
          + Add More option
        </button>
      </div>
      <hr />
      <button
        className="btn rounded-pill ask-question px-4 m-2"
        onClick={askQuestion}
      >
        Ask Question
      </button>
    </>
  );
};

export default TeacherLandingPage;