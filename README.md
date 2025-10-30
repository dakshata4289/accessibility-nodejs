```
# 🌐 Accessibility Scanner Backend (Node.js + TypeScript)

A powerful, scalable backend built with **Node.js**, **Express**, and **TypeScript**, designed to **analyze website accessibility** using automated audits (like `axe-core`) and **generate detailed accessibility reports** for users.

This backend follows **Clean Architecture** principles for maintainability, scalability, and clarity — ideal for real-world production use.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-------------|
| Language | TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Testing | Jest |
| Logging | Winston / Morgan |
| Linting | ESLint + Prettier |
| Containerization | Docker |
| Environment | dotenv |

---

## ✨ Key Features

✅ **Website Accessibility Scanning**
- Scans any website for WCAG compliance using `axe-core`
- Detects accessibility violations, best practices, and improvement opportunities

✅ **Report Generation**
- Automatically summarizes accessibility issues into structured JSON and human-readable reports
- Supports report categorization (errors, warnings, passes)

✅ **User Management**
- Users can submit URLs for analysis and receive reports via email (optional future feature)

✅ **Clean Architecture**
- Modular separation between controllers, services, repositories, and models

✅ **Type Safety**
- 100% TypeScript support with strict type checking

✅ **Error Handling**
- Centralized error management middleware

✅ **Scalable Folder Structure**
- Organized for maintainability and easy feature expansion

✅ **Testing Ready**
- Preconfigured Jest setup for unit/integration testing

✅ **Environment Config**
- Secure `.env` handling for DB connections, API keys, etc.

✅ **Dockerized**
- Ready for containerized deployment

---

## 📁 Project Structure

ACCESSIBILITY-NODEJS/
│
├── src/
│ ├── server.ts # Entry point (starts Express server)
│ │
│ ├── config/
│ │ └── dbConfig.ts # MongoDB connection configuration
│ │
│ ├── models/ # Database Schemas (Mongoose)
│ │ ├── reportsModel.ts # Stores accessibility report data
│ │ ├── reportStatsModel.ts # Stores aggregated report statistics
│ │ ├── scannedWebsitesModel.ts# Stores scanned website metadata
│ │ └── userModel.ts # User information (email, organization, etc.)
│ │
│ ├── routes/
│ │ ├── reportsRoute.ts # API routes for fetching reports
│ │ └── scanRoute.ts # API routes for performing scans
│ │
│ ├── utils/
│ │ ├── accessibilityTest.ts # Core accessibility scan logic (axe-core integration)
│ │ ├── decodeAxeResult.ts # Parses and formats raw accessibility data
│ │ └── summarizeReport.ts # Generates summarized statistics and findings
│ │
│ └── config/
│ └── dbConfig.ts # MongoDB connection settings
│
├── .env # Environment variables
├── .gitignore
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
└── .env.example # Example environment file

yaml


---

## ⚙️ Installation

### Clone the repository

git clone https://github.com/your-username/accessibility-nodejs.git
cd accessibility-nodejs
Install dependencies
Using npm:

npm install
or pnpm:
pnpm install

Create environment file
Create a .env file in the project root:

env
PORT=5000
MONGO_URI=mongodb://localhost:27017/accessibilitydb
NODE_ENV=development
(You can refer to .env.example for the template.)

🧠 Usage
🏃 Run the Development Server

npm run dev
This will start the server using ts-node-dev with live reloading.

Server will be available at:

http://localhost:5000
🧩 Example API Endpoints
🔍 Scan a Website
POST /api/scan



{
  "url": "https://example.com"
}
Response


{
  "status": "success",
  "reportId": "6531c2d89f1e2a6d8b4e8e77",
  "message": "Accessibility scan completed successfully."
}
📊 Get All Reports
GET /api/reports

Response


[
  {
    "_id": "6531c2d89f1e2a6d8b4e8e77",
    "url": "https://example.com",
    "violations": 12,
    "passes": 89,
    "incomplete": 3,
    "timestamp": "2025-10-26T08:12:45.123Z"
  }
]
🧪 Testing
Run tests using Jest:

npm test
Add new test files inside src/tests/ following this pattern:

src/tests/scan.test.ts
🐳 Docker Setup (Optional)
Build the Docker image


docker build -t accessibility-nodejs .
Run the container


docker run -p 5000:5000 --env-file .env accessibility-nodejs
📜 Scripts

Command	Description
npm run dev	Run server in development mode
npm run build	Transpile TypeScript to JavaScript
npm run start	Start built server (production)
npm run lint	Run ESLint
npm run test	Run Jest tests

🧱 Clean Architecture Layers
bash
Copy code
┌─────────────────────────────┐
│         Routes (API)        │  ← Express endpoints
├─────────────────────────────┤
│       Controllers           │  ← Handle request/response
├─────────────────────────────┤
│         Services            │  ← Business logic
├─────────────────────────────┤
│        Repositories         │  ← Data persistence (MongoDB)
├─────────────────────────────┤
│           Models            │  ← Mongoose schemas
└─────────────────────────────┘


🧰 Future Enhancements
 Email notifications for completed scans

 PDF report generation

 Multi-user dashboard for accessibility insights

 Integration with frontend client

 Scheduling periodic scans

👨‍💻 Contributing
Fork the repository

Create your feature branch: git checkout -b feature/amazing-feature

Commit changes: git commit -m 'Add amazing feature'

Push branch: git push origin feature/amazing-feature

Create a Pull Request 🎉

🪪 License
This project is licensed under the MIT License — see the LICENSE file for details.
