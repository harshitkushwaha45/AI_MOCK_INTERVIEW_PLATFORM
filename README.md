# 🤖 AI Mock Interview Platform

> A full-stack AI-powered mock interview platform designed to simulate real interview experiences, evaluate candidate responses, and provide actionable performance feedback.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-Fast%20Build-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

---

## 🌐 Live Demo

🚀 **Live Application:**
https://ai-mock-interview-platform-1-ofb2.onrender.com

📂 **GitHub Repository:**
https://github.com/harshitkushwaha45/AI_MOCK_INTERVIEW_PLATFORM

---

## 📌 Overview

The **AI Mock Interview Platform** is a full-stack web application that provides users with an interactive environment to practice **HR and Technical interviews**.

The platform follows a complete interview workflow:

```text
Select Interview
      ↓
Get Questions
      ↓
Answer Questions
      ↓
Submit Responses
      ↓
Evaluate Answers
      ↓
Generate Feedback
      ↓
Calculate Scores
      ↓
View Performance
```

It combines a React-based frontend with a Node.js/Express backend to provide a structured interview experience and performance analysis.

---

# ✨ Key Features

### 🎯 Interview Categories

Users can practice different types of interviews, including:

* HR Interviews
* Technical Interviews
* Category-based question selection
* Structured interview flow

---

### 📝 Dynamic Question System

* Questions are retrieved dynamically through backend REST APIs.
* Questions are categorized according to the selected interview type.
* Users answer questions one by one.
* Interview responses are processed after submission.

---

### ⏱️ Timed Interview Experience

The interview environment includes a **question-based timer** to simulate real interview pressure.

* Countdown timer
* Automatic question progression
* Time-based answer handling
* Structured interview flow

---

### 🤖 AI-Based Answer Evaluation

The platform evaluates submitted answers using an AI/mock feedback system.

For each response, users can receive:

* Answer evaluation
* Score
* Strengths
* Weaknesses
* Improvement suggestions
* Question-specific feedback

> The current project uses a mock feedback system, with real AI integration planned for future development.

---

### 📊 Performance Analytics

After completing an interview, users receive a performance summary containing:

* Overall score
* Question-wise scores
* Strengths
* Weaknesses
* Suggestions for improvement
* Visual performance representation

Charts are implemented using **Chart.js**.

---

### 💾 Interview Result Storage

Interview results can be maintained on the client side using **Local Storage**, allowing users to retain their interview performance during the application session.

---

### 🎨 Interactive User Interface

The frontend is designed with a clean and focused interface containing:

* Interview selection screens
* Question interface
* Answer submission interface
* Feedback cards
* Score displays
* Performance charts
* Result summary

---

# 🧠 AI Components

The project is designed around several AI-related concepts:

### AI Question Generation

The architecture supports generating interview questions according to:

* Interview category
* Technical domain
* Candidate requirements
* Interview type

### AI Answer Evaluation

Candidate answers can be evaluated using structured evaluation criteria such as:

```text
Answer
   ↓
Evaluation
   ↓
Score
   ↓
Strengths + Weaknesses
   ↓
Improvement Suggestions
```

### AI Feedback

The feedback system focuses on providing meaningful information rather than only returning a numerical score.

---

# 🛠️ Technology Stack

## Frontend

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| React.js       | Building the user interface    |
| Vite           | Development and build tooling  |
| JavaScript     | Application logic              |
| CSS            | UI styling                     |
| Chart.js       | Performance visualization      |
| face-api.js    | Facial analysis functionality  |
| TensorFlow.js  | Browser-based ML functionality |
| Web Speech API | Speech-to-text functionality   |

## Backend

| Technology | Purpose                     |
| ---------- | --------------------------- |
| Node.js    | Backend runtime             |
| Express.js | REST API framework          |
| REST APIs  | Client-server communication |
| Multer     | File upload handling        |
| pdf-parse  | Resume/PDF text extraction  |
| JWT        | Authentication architecture |

## Database

| Technology | Purpose                           |
| ---------- | --------------------------------- |
| MongoDB    | User and application data storage |

## AI / ML

| Technology     | Purpose                            |
| -------------- | ---------------------------------- |
| OpenAI API     | AI-powered evaluation architecture |
| TensorFlow.js  | Browser-based machine learning     |
| face-api.js    | Facial feature analysis            |
| Web Speech API | Speech recognition                 |

---

# 👁️ Computer Vision

The project also includes browser-based computer vision functionality using:

* **face-api.js**
* **TensorFlow.js**

The system can process facial information through the browser and is designed to support interview analysis such as:

* Face detection
* Facial landmarks
* Expression/emotion analysis
* Real-time camera processing

Supported expression categories include:

* Happy
* Neutral
* Sad
* Angry
* Surprised

---

# 🎙️ Speech-Based Interview Support

The platform also includes speech-processing functionality using the browser's **Web Speech API**.

The system can convert spoken responses into text, allowing users to answer interview questions through voice instead of only typing.

```text
User speaks
     ↓
Speech Recognition
     ↓
Text Conversion
     ↓
Answer Processing
     ↓
Feedback
```

---

# 📄 Resume Processing

The platform includes resume-processing functionality using:

* **Multer** for file uploads
* **pdf-parse** for extracting text from PDF resumes

This architecture allows candidate information to be extracted from uploaded resumes and used as a foundation for personalized interview experiences.

---

# 🔐 Authentication

The backend architecture includes authentication functionality using:

* JWT-based authentication
* Login/Register APIs
* Protected application resources
* Secure token-based user identification

---

# 🔌 Backend API Architecture

The application follows a RESTful API architecture.

Example API structure:

```text
/api
│
├── /auth
│   ├── register
│   └── login
│
├── /questions
│   └── ?category=technical
│
└── /interview
    └── /feedback
```

### Example Workflow

```text
React Frontend
      │
      │ HTTP Request
      ↓
Express Server
      │
      ├── Authentication
      ├── Question API
      ├── Interview API
      └── Feedback API
      │
      ↓
Response
      │
      ↓
React UI
```

---

# 📂 Project Structure

```text
AI_MOCK_INTERVIEW_PLATFORM/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── README.md
└── ...
```

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/harshitkushwaha45/AI_MOCK_INTERVIEW_PLATFORM.git
```

```bash
cd AI_MOCK_INTERVIEW_PLATFORM
```

---

## 2. Backend Setup

```bash
cd server
npm install
npm run dev
```

---

## 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the server directory.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_api_key
```

> Never commit `.env` files or API keys to GitHub.

---

# 🚀 Application Workflow

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Select Interview    │
                  │ HR / Technical      │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Fetch Questions     │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Answer Questions    │
                  │ Text / Voice        │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Answer Evaluation   │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Score + Feedback    │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Performance Report  │
                  └─────────────────────┘
```

---

# 🔮 Future Improvements

The project can be further enhanced with:

* Fully integrated real-time AI evaluation
* Personalized questions based on uploaded resumes
* Advanced interview analytics
* Persistent interview history
* PDF performance reports
* Improved emotion analysis
* Advanced speech analysis
* Personalized interview difficulty
* RAG-based interview question generation
* Vector database integration
* Interview recommendation system

---

# 🎯 Project Goals

The main goal of this project is to create an accessible interview practice environment where candidates can:

* Practice interviews independently
* Improve answer quality
* Identify weaknesses
* Track performance
* Experience realistic interview conditions
* Receive structured feedback

---

# 👨‍💻 Author

### Harshit Kushwaha

B.Tech Information Technology Student

**GitHub:**
https://github.com/harshitkushwaha45

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
