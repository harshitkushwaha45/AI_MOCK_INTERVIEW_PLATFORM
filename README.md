# 🤖 AI Mock Interview Platform

> A full-stack AI-powered mock interview platform designed to simulate real interview experiences, evaluate candidate responses, and provide actionable performance feedback.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
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

The **AI Mock Interview Platform** is a full-stack web application that provides users with an interactive environment to practice **HR, Technical, and Resume-based interviews**.

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
* Resume-Based Interviews
* Structured interview flow

---

### 📝 Dynamic Question System

* Questions are generated dynamically through backend REST APIs (with built-in fallback questions).
* Questions are tailored to the selected interview type or uploaded resume.
* Users answer questions one by one at their own pace.
* Interview responses are processed after submission.

---

### 🤖 AI-Based Answer Evaluation

The platform evaluates submitted answers using **Gemini** or **OpenAI** (with an automatic rule-based fallback if an AI provider is unavailable).

For each response, users receive:

* Answer evaluation
* Score
* Summary strengths and weaknesses
* Improvement suggestions
* Skill-level analytics across sessions

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

Interview results are persisted in **MongoDB** per authenticated user and cached locally during the session for immediate review.

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
* Candidate resume contents
* Interview type

### AI Answer Evaluation

Candidate answers are evaluated using structured evaluation criteria such as:

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

The feedback system focuses on providing actionable guidance and skill breakdowns rather than only returning a numerical score.

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
| Multer     | In-memory PDF upload handling |
| pdf-parse  | Resume/PDF text extraction  |
| JWT        | Authentication architecture |

## Database

| Technology | Purpose                           |
| ---------- | --------------------------------- |
| MongoDB    | User and application data storage |

## AI / ML

| Technology     | Purpose                            |
| -------------- | ---------------------------------- |
| Gemini / OpenAI API | AI-powered question & answer evaluation |
| TensorFlow.js  | Browser-based machine learning     |
| face-api.js    | Facial feature analysis            |
| Web Speech API | Speech recognition                 |

---

# 👁️ Computer Vision

The project also includes browser-based computer vision functionality using:

* **face-api.js**
* **TensorFlow.js**

The system processes facial information through the browser to support interview presence analysis such as:

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

The platform includes speech-processing functionality using the browser's **Web Speech API**.

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

* **Multer** for in-memory file uploads
* **pdf-parse** for extracting text from PDF resumes

This architecture extracts candidate information from uploaded PDF resumes to generate resume review feedback and personalized interview questions.

---

# 🔐 Authentication

The backend includes authentication functionality using:

* JWT-based authentication
* Login/Register APIs
* Protected application resources
* Secure token-based user identification

---

# 🔌 Backend API Architecture

The application follows a RESTful API architecture.

```text
/api
│
├── /auth
│   ├── POST /register
│   └── POST /login
│
├── /questions
│   └── GET /?category=technical
│
├── /resume
│   ├── POST /upload
│   └── POST /generate-questions
│
├── /interview
│   └── POST /feedback
│
└── /results
    ├── GET /
    ├── GET /analytics/skills
    └── GET /:id
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
│   │   ├── utils/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── data/
│   ├── server.js
│   └── package.json
│
├── render.yaml
├── package.json
└── README.md
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

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
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
                  │ Upload Resume /     │
                  │ Select Interview    │
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

* PDF performance report exports
* Expanded interview domains and difficulty levels
* RAG-based question generation with vector search
* Multi-language speech support

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
