import React, { useState } from "react";
import stars from "../../assets/spark.svg";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const selectRole = (role) => {
    setSelectedRole(role);
  };

  const continueToPoll = () => {
    if (selectedRole === "teacher") {
      sessionStorage.setItem("username", "teacher");
      navigate("/teacher-home-page");
    } else if (selectedRole === "student") {
      const uniqueID = "student-" + crypto.randomUUID();  // safer unique ID
      sessionStorage.setItem("username", uniqueID);
      navigate("/student-home-page");
    } else {
      alert("Please select a role.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="poll-container text-center">
        <button className="btn btn-sm intervue-btn mb-5">
          <img src={stars} className="px-1" alt="" />
          Intervue Poll
        </button>
        <h3 className="poll-title">
          Welcome to the <b>Live Polling System</b>
        </h3>
        <p className="poll-description">
          Please select the role that best describes you to begin using the live polling system
        </p>

        <div className="d-flex justify-content-around mb-4">
          <div
            className={`role-btn ${selectedRole === "student" ? "active" : ""}`}
            onClick={() => selectRole("student")}
          >
            <p>I'm a Student</p>
            <span>
              who can submit answers and view live poll results in real-time.
            </span>
            {selectedRole === "student" && (
              <p className="mt-2 text-muted" style={{ fontSize: 12 }}>
                A unique ID will be assigned to you automatically.
              </p>
            )}
          </div>

          <div
            className={`role-btn ${selectedRole === "teacher" ? "active" : ""}`}
            onClick={() => selectRole("teacher")}
          >
            <p>I'm a Teacher</p>
            <span>Submit answers and view live poll results in real-time.</span>
          </div>
        </div>

        <button className="btn continue-btn" onClick={continueToPoll}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default LoginPage;