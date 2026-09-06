import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import axios from "axios";
import "./Chatbot.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({});
  const [nextField, setNextField] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi! I'm SchemeCheck Assistant. I can help you find government schemes you're eligible for.",
    },
  ]);

  // ==========================================================
  // CONVERT AND SAVE USER'S ANSWER
  // ==========================================================

  const saveAnswer = (field, value) => {
    let convertedValue = value.trim();

    // --------------------------------------------------------
    // AGE
    // --------------------------------------------------------

    if (field === "age") {
      const age = parseInt(convertedValue);

      if (!isNaN(age)) {
        convertedValue = age;
      }
    }

    // --------------------------------------------------------
    // ANNUAL INCOME
    // --------------------------------------------------------

    if (field === "annualIncome") {
      const income = parseFloat(
        convertedValue
          .replace(/,/g, "")
          .replace(/₹/g, "")
      );

      if (!isNaN(income)) {
        convertedValue = income;
      }
    }

    // --------------------------------------------------------
    // YES / NO FIELDS
    //
    // IMPORTANT:
    // disability and parentDisability are included here.
    // --------------------------------------------------------

    if (
      field === "tnResident" ||
      field === "currentlyEnrolled" ||
      field === "disability" ||
      field === "parentDisability"
    ) {
      const answer =
        convertedValue.toLowerCase();

      if (
        answer === "yes" ||
        answer === "y" ||
        answer === "true"
      ) {
        convertedValue = "yes";
      } else if (
        answer === "no" ||
        answer === "n" ||
        answer === "false"
      ) {
        convertedValue = "no";
      }
    }

    // --------------------------------------------------------
    // UPDATE PROFILE
    // --------------------------------------------------------

    const updatedProfile = {
      ...profile,
      [field]: convertedValue,
    };

    setProfile(updatedProfile);

    return updatedProfile;
  };

  // ==========================================================
  // SEND NORMAL MESSAGE / ANSWER
  // ==========================================================

  const sendMessage = async () => {
    if (
      !message.trim() ||
      isSending
    ) {
      return;
    }

    const userMessage =
      message.trim();

    // --------------------------------------------------------
    // SHOW USER MESSAGE
    // --------------------------------------------------------

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setIsSending(true);

    try {
      // ------------------------------------------------------
      // COPY CURRENT PROFILE
      // ------------------------------------------------------

      let updatedProfile = {
        ...profile,
      };

      // ------------------------------------------------------
      // IF BOT IS WAITING FOR AN ANSWER
      // SAVE ANSWER TO CORRECT FIELD
      // ------------------------------------------------------

      if (nextField) {
        updatedProfile = saveAnswer(
          nextField,
          userMessage
        );
      }

      console.log(
        "Sending profile:",
        updatedProfile
      );

      console.log(
        "Answering field:",
        nextField
      );

      // ------------------------------------------------------
      // SEND TO BACKEND
      // ------------------------------------------------------

      const response =
        await axios.post(
          "http://localhost:5000/api/chat",
          {
            message: userMessage,

            profile:
              updatedProfile,

            isAnswering:
              !!nextField,
          }
        );

      console.log(
        "Backend response:",
        response.data
      );

      // ------------------------------------------------------
      // SET NEXT QUESTION
      // ------------------------------------------------------

      if (
        response.data.nextField
      ) {
        setNextField(
          response.data.nextField
        );
      } else {
        setNextField(null);
      }

      // ------------------------------------------------------
      // SHOW BOT RESPONSE
      // ------------------------------------------------------

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text:
            response.data.reply ||
            "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      console.error(
        "Chatbot error:",
        error
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text:
            "Sorry, I couldn't connect to the chatbot service.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // ==========================================================
  // START ELIGIBILITY CHECK
  // ==========================================================

  const startEligibilityCheck =
    async () => {
      if (isSending) {
        return;
      }

      const text =
        "Which schemes am I eligible for?";

      // ------------------------------------------------------
      // SHOW USER MESSAGE
      // ------------------------------------------------------

      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          text,
        },
      ]);

      setIsSending(true);

      try {
        // ----------------------------------------------------
        // SEND ELIGIBILITY REQUEST
        // ----------------------------------------------------

        const response =
          await axios.post(
            "http://localhost:5000/api/chat",
            {
              message: text,

              profile: profile,

              isAnswering: false,
            }
          );

        console.log(
          "Eligibility response:",
          response.data
        );

        // ----------------------------------------------------
        // SET NEXT QUESTION
        // ----------------------------------------------------

        if (
          response.data.nextField
        ) {
          setNextField(
            response.data.nextField
          );
        } else {
          setNextField(null);
        }

        // ----------------------------------------------------
        // SHOW BOT RESPONSE
        // ----------------------------------------------------

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text:
              response.data.reply ||
              "Sorry, I couldn't generate a response.",
          },
        ]);
      } catch (error) {
        console.error(
          "Chatbot error:",
          error
        );

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text:
              "Sorry, I couldn't connect to the chatbot service.",
          },
        ]);
      } finally {
        setIsSending(false);
      }
    };

  // ==========================================================
  // STUDENT SCHEMES BUTTON
  // ==========================================================

  const showStudentSchemes = () => {
    if (isSending) {
      return;
    }

    setMessage(
      "Show schemes for students"
    );
  };

  // ==========================================================
  // RESET CHATBOT
  // ==========================================================

  const resetChat = () => {
    setProfile({});
    setNextField(null);
    setMessage("");

    setMessages([
      {
        type: "bot",
        text: "Hi! I'm SchemeCheck Assistant. I can help you find government schemes you're eligible for.",
      },
    ]);
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* =====================================================
          FLOATING CHATBOT BUTTON
          ===================================================== */}

      {!isOpen && (
        <button
          className="chatbot-button"
          onClick={() =>
            setIsOpen(true)
          }
          aria-label="Open chatbot"
        >
          <MessageCircle
            size={24}
          />
        </button>
      )}

      {/* =====================================================
          CHAT WINDOW
          ===================================================== */}

      {isOpen && (
        <div className="chatbot-window">

          {/* =================================================
              HEADER
              ================================================= */}

          <div className="chatbot-header">

            <div>
              <h3>
                SchemeCheck Assistant
              </h3>

              <span>
                Here to help you
              </span>
            </div>

            <button
              className="chatbot-close"
              onClick={() =>
                setIsOpen(false)
              }
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>

          </div>

          {/* =================================================
              MESSAGES
              ================================================= */}

          <div className="chatbot-messages">

            {messages.map(
              (msg, index) => (
                <div
                  key={index}
                  className={`message-row ${msg.type}`}
                >

                  <div
                    className={`message ${msg.type}`}
                  >
                    {msg.text}
                  </div>

                </div>
              )
            )}

            {/* -----------------------------------------------
                THINKING MESSAGE
                ----------------------------------------------- */}

            {isSending && (
              <div className="message-row bot">

                <div className="message bot">
                  Thinking...
                </div>

              </div>
            )}

          </div>

          {/* =================================================
              SUGGESTIONS
              ================================================= */}

          <div className="suggestions">

            {/* -----------------------------------------------
                ELIGIBILITY
                ----------------------------------------------- */}

            <button
              onClick={
                startEligibilityCheck
              }
              disabled={isSending}
            >
              Which schemes am I eligible for?
            </button>

            {/* -----------------------------------------------
                STUDENT SCHEMES
                ----------------------------------------------- */}

            <button
              onClick={
                showStudentSchemes
              }
              disabled={isSending}
            >
              Schemes for students
            </button>

          </div>

          {/* =================================================
              INPUT AREA
              ================================================= */}

          <div className="chatbot-input-area">

            <input
              type="text"
              placeholder="Ask about government schemes..."
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={isSending}
            />

            <button
              className="send-button"
              onClick={
                sendMessage
              }
              disabled={isSending}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>

          </div>

        </div>
      )}
    </>
  );
}

export default Chatbot;