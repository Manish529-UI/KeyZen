# KeyZen

A modern MERN-stack password manager designed to securely manage user credentials.

## Features

- **User authentication** — Secure register and login flow
- **Secure password vault** — Store, manage, and access your credentials
- **Encrypted password storage** — Highly secure AES-256-GCM encryption
- **Email OTP / two-step verification** — Mandatory 6-digit OTP sent to email on login
- **Brute-force protection** — Account locks after 5 failed login attempts
- **Security settings/dashboard** — Real-time security metrics and active features overview
- **Password Generator** — Create strong passwords with custom length and character options
- **Password Health** — Security score, weak/reused/old password detection
- **Favorites** — Quick access to your most-used credentials
- **Modern React frontend** — Fully responsive dark/light theme UI
- **Node.js + Express backend** — RESTful API architecture
- **MongoDB database** — Secure data storage with Mongoose

## Tech Stack

**Frontend:**
- React 18
- Vite
- React Router
- Lucide React (Icons)
- Vanilla CSS (Custom properties & responsive design)

**Backend:**
- Node.js
- Express.js
- MongoDB / Mongoose
- Nodemailer (for OTP emails)
- Express Rate Limit

**Authentication/Security:**
- JWT (JSON Web Tokens)
- AES-256-GCM authenticated encryption (Node `crypto`)
- bcryptjs (Password hashing)
- Email OTP verification
- API Rate limiting & Brute force lockouts

## Project Structure

```
Keyzen/
├── backend/
│   ├── config/              # Database connection
│   ├── controllers/         # API logic (auth, vault)
│   ├── middleware/          # JWT auth & Rate limiters
│   ├── models/              # Mongoose schemas (User, VaultItem)
│   ├── routes/              # Express routes
│   ├── utils/               # Encryption & Email services
│   ├── .env.example         # Template for environment variables
│   ├── server.js            # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Auth, Toast, etc.)
│   │   ├── pages/           # Application views (Dashboard, Login, OTP, etc.)
│   │   ├── services/        # Axios API configurations
│   │   ├── App.jsx          # Main router
│   │   └── index.css        # Global stylesheet
│   └── package.json
│
└── .gitignore               # Root gitignore to protect secrets
```

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Keyzen
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory from the example file:

```bash
cp .env.example .env
```

Open `backend/.env` and add your real configurations:
- MongoDB connection string (`MONGO_URI`)
- JWT secret (`JWT_SECRET`)
- 64-character hex encryption key (`ENCRYPTION_KEY`)
- Gmail credentials for OTP (`EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`)

*(See Security Notes below)*

### 5. Start the Backend

```bash
# In the backend directory
npm run dev
```
The server will start on `http://localhost:5000`.

### 6. Start the Frontend

```bash
# In a new terminal, from the frontend directory
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Environment Variables

The `backend/.env.example` file contains **placeholders only**. You must create your own `.env` file and fill it with your real configuration.

**DO NOT** commit your real `.env` file to version control.

## Security Notes ⚠️

To ensure the safety of your data and infrastructure:
- **Never commit `.env`** to GitHub or any public repository.
- **Never expose MongoDB credentials** in your code.
- **Never expose JWT secrets** in your code.
- **Never expose encryption keys** in your code.
- **Never expose Gmail App Passwords** in your code.
- Always keep production secrets in secure environment variables on your hosting provider.
