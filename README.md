# Class Booking Management System (Software Testing Training)

A robust, intentionally vulnerable-by-design Class Booking Management platform built specifically for Software Testing Training. This application is architected using a microservices pattern on the backend and a Neumorphism-styled Next.js 15 interface on the frontend.

## 🚀 Architecture Overview

The system is designed to be deployed seamlessly to **Vercel** (for Serverless Frontend & Backend) and **Neon** (for Serverless PostgreSQL).

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Zustand.
- **Backend Microservices**: Node.js, Express, `pg` (PostgreSQL Client), JWT Authentication.
  - **Auth Service**: Manages user authentication, token issuance, and refresh token rotation.
  - **Booking Service**: Handles the core state-machine of class reservations (Draft, Submit, Claim, Forward, Approve, Reject).
  - **Notification Service**: Manages in-app Server-Sent Events (SSE) and persistent notifications.
- **Database**: PostgreSQL (Neon Serverless DB).

---

## 💻 Local Development Setup

To run the application locally, you can choose between two methods:

### Option 1: Docker Compose (Recommended for local backend testing)
1. Ensure Docker Desktop is running.
2. In the root directory, start the infrastructure:
   ```bash
   docker-compose up --build -d
   ```
   *This starts the PostgreSQL database and all backend microservices locally.*
3. Open a new terminal, navigate to the frontend, and start the Next.js app:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Option 2: Local Node.js (No Docker)
1. Install PostgreSQL locally and create a database named `class_booking`.
2. Run the SQL scripts located in the `database/` folder to create schemas and seed data:
   ```bash
   psql -U postgres -d class_booking -f database/schema.sql
   psql -U postgres -d class_booking -f database/seed.sql
   ```
3. In separate terminal windows, start the frontend and each microservice inside `backend/` by running `npm install` and `npm start`.

---

## ☁️ Production Deployment (Vercel + Neon)

The system is configured to deploy effortlessly to Vercel as a unified monorepo. Vercel acts as the API Gateway, utilizing the `vercel.json` file to map `/api/*` traffic to the backend Express Serverless Functions.

### Step 1: Database Setup (Neon)
1. Create a free account at [Neon.tech](https://neon.tech/).
2. Create a new PostgreSQL project.
3. In the Neon SQL Editor, execute the contents of `database/schema.sql` and `database/seed.sql` to initialize your tables and testing data.
4. Copy your **Pooled Connection String** (it will look like `postgres://user:pass@ep-cool-name-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`).

### Step 2: Vercel Deployment
1. Push this repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. Leave the Framework Preset as `Next.js`. (Vercel will automatically read `vercel.json` to handle the microservices).
5. Open the **Environment Variables** section and add:
   - `DATABASE_URL`: *[Paste your Neon Pooled Connection String here]*
   - `JWT_SECRET`: *[Create a strong random string (e.g., `super_secret_training_key_2026`)]*
6. Click **Deploy**.

> **⚠️ Server-Sent Events (SSE) Caveat on Vercel:** 
> Vercel's Serverless Functions have a maximum execution timeout (10s on Free, 60s on Pro). The Notification Service's SSE connection (`/api/notifications/stream`) will drop when the function times out. The frontend will automatically attempt to reconnect, but for true persistent WebSockets/SSE in production, a dedicated containerized deployment (e.g., Render, Railway) is recommended over Serverless.

---

## 🧪 Software Testing Training Guide

This system is purposefully built to support **Software Testing Classes**. It contains specific workflows, state transitions, and intentionally designed architectural "edges" for students to discover.

### Roles and Seeded Test Accounts
All seeded accounts share the password: `password123`

| Role | Email | Description |
|------|-------|-------------|
| **CREATOR** | `creator1@test.com` | Can draft, submit, and cancel bookings. |
| **REVIEWER** | `reviewer1@test.com` | Can claim pending reviews, forward to approvers, or reject. |
| **APPROVER** | `approver1@test.com` | Final authority to approve or reject forwarded requests. |
| **ADMIN** | `admin@test.com` | System administrator with full visibility. |

### Core Testing Scenarios
Instructors can use this application to teach:
1. **State Machine / Business Logic Testing**: Verifying that a Booking cannot jump from `DRAFT` directly to `APPROVED` without passing through `IN_REVIEW`.
2. **Role-Based Access Control (RBAC)**: Ensuring a `CREATOR` cannot call the `PATCH /api/bookings/:id/approve` endpoint.
3. **Concurrency & Capacity Testing**: Attempting to double-book a classroom (`slot_id` + `date`) simultaneously.
4. **API Security**: Testing JWT tampering, missing tokens, and SQL Injection vulnerabilities (if any are introduced during training exercises).

---

## 🎨 Design System
The frontend implements a custom **Neumorphism** (Soft UI) design system:
- **Palette**: Cool Slate Gray background (`#e2e8f0`) with Electric Teal accents (`#0d9488`).
- **Styling**: Utilizes heavy inner and drop shadows to create a "pressed" or "extruded" physical button feel.
- **Animations**: Powered by `framer-motion` for smooth page transitions and micro-interactions.
