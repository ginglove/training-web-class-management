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
3. Once created, you can initialize the database in two ways:
   - **Method A (CLI)**: Set your `DATABASE_URL` in your local `.env` and run:
     ```bash
     npm run db:seed
     ```
   - **Method B (GUI)**: In the Neon SQL Editor, execute the contents of `database/schema.sql` and `database/seed.sql`.
4. Copy your **Pooled Connection String** (ensure it has `?sslmode=require`).

### Step 2: Vercel Deployment
1. Push this repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and import your repository.
3. In the **Environment Variables** section, add:
   - `DATABASE_URL`: *[Your Neon Connection String]*
   - `JWT_SECRET`: *[A random string for security]*
   - `NODE_ENV`: `production`
4. Click **Deploy**.

> **⚠️ Serverless Architecture Note:**
> Since this is deployed using Vercel Functions, the microservices are technically "Stateless Functions". In-memory states (like SSE registries in the notification service) will behave differently than in a persistent server. The system is designed to handle this by using the database as the source of truth, but SSE connections will periodically reconnect.

> **💡 Vercel Deployment Note:**
> During deployment, you may see a warning: *"Due to builds existing in your configuration file, the Build and Development Settings... will not apply"*. This is **expected** and safe to ignore, as the `vercel.json` file is intentionally used to orchestrate the multi-service build.

> **🛡️ Security Patch:**
> The frontend has been upgraded to **Next.js 15.1.7** to address CVE-2025-66478.

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
