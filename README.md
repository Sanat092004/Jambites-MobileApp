## 🍔 Jambites — Food Delivery During Traffic Jams

Jambites is a system designed to deliver snacks, beverages, and essential medicines directly to users stuck in traffic.
The goal is to turn idle time in traffic into a convenient ordering experience.

This repository contains the backend system and core platform logic built using a TypeScript monorepo architecture. The mobile app interface is under development within this same repository.

## 🧩 Problem Statement

Urban traffic congestion leads to:

Long idle times for commuters

Limited access to food or essentials during travel

Poor utilization of vendor reach during peak hours

Jambites addresses this by enabling location-based ordering during traffic conditions.


## 📁 Project Structure

```text
Jambites-MobileApp/
├── artifacts/
│   ├── api-server/           # Express backend API
│   └── mockup-sandbox/       # UI prototypes (work in progress)
│
├── lib/
│   ├── db/                   # Database schema and configuration (Drizzle ORM)
│   ├── api-spec/             # OpenAPI specification
│   ├── api-client-react/     # Auto-generated API client (React Query)
│   ├── api-zod/              # Zod validation schemas
│   └── integrations/
│       └── anthropic-ai/     # Claude AI chatbot integration
│
├── scripts/                  # Utility and automation scripts
│
├── tsconfig.base.json        # Shared TypeScript configuration
├── tsconfig.json             # Root TypeScript configuration
└── pnpm-workspace.yaml       # Workspace configuration
```
## 🛠️ Tech Stack

### Backend
- Node.js  
- Express 5  
- TypeScript  

### Database
- PostgreSQL  
- Drizzle ORM  

### API Layer
- OpenAPI 3.1  
- Orval (code generation)  
- React Query (API client)  
- Zod (validation)  

### AI
- Anthropic Claude API  

### Tooling & Infra
- pnpm (monorepo workspace)  
- esbuild  
- Replit (deployment)  
## ⚙️ Core Features

### ✅ Implemented (Phase 1)

#### Backend API
- Express-based REST API architecture  
- Modular routing structure  
- Health check endpoint (`/api/health`)  

#### Database Layer
- PostgreSQL integration  
- Schema management using Drizzle ORM  

#### API Contract System
- OpenAPI 3.1 specification  
- Auto-generated API client (React Query)  
- Shared validation using Zod  

#### AI Chatbot (Jammy)
- Claude-powered chatbot integration  
- Handles basic user queries  
- Context-aware responses using prompt injection (order state, time, simulated traffic)  

#### Jam Simulation
- Time-based traffic simulation:
  - Morning: 8–10 AM  
  - Evening: 6–8 PM  

---

### 🔄 In Progress (Phase 2)

#### Ordering System
- Vendor discovery (location-based)  
- Menu retrieval  
- Order placement and tracking  

#### Authentication
- Phone-based OTP login system  

#### Real-Time Features
- Live order status updates  
- Rider tracking (basic implementation)  

---

### 🧪 Planned (Future Scope)

- Payment integration (Razorpay)  
- Real-time communication via WebSockets  
- Improved traffic detection (data-driven)  
**🚧 Work in Progress**
🔄 Mobile App Interface

UI currently in development within mockup-sandbox

No production-ready mobile build yet

## 🧪 Example System Flow
1. User location is captured
2. System checks for traffic (simulated)
3. Nearby vendors are fetched
4. User selects items from menu
5. Order is placed via API
6. Order status can be tracked
## 🔌 API Endpoints

| Method | Endpoint                     | Description                     | Status                     |
|--------|------------------------------|----------------------------------|----------------------------|
| GET    | `/api/health`               | Health check                     | ✅ Implemented             |
| GET    | `/api/vendors/nearby`       | Fetch nearby vendors             | ✅ Implemented (Mock Data) |
| GET    | `/api/vendors/:id/menu`     | Get vendor menu                  | ✅ Implemented (Mock Data) |
| POST   | `/api/orders`               | Place a new order                | 🔄 In Progress             |
| GET    | `/api/orders/:id/status`    | Get order status + tracking      | ✅ Implemented (Mock Data) |
| GET    | `/api/user/orders/history`  | Fetch user order history         | ✅ Implemented (Mock Data) |
| POST   | `/api/promo/validate`       | Validate promo codes             | ✅ Implemented (Mock Data) |
| GET    | `/api/traffic/jam-check`    | Check traffic/jam condition      | ✅ Implemented             |
| POST   | `/api/auth/otp/send`        | Send OTP to user phone           | 🔄 Planned                 |
| POST   | `/api/auth/otp/verify`      | Verify OTP and return JWT        | 🔄 Planned                 |
> ⚠️ Note: Some endpoints currently return mock data for development and testing purposes. Integration with live database and real-time services is in progress.

## ⚙️ Setup & Installation

### 📌 Prerequisites
Make sure you have the following installed:

- Node.js (v18 or higher recommended)
- pnpm (workspace package manager)
- PostgreSQL database

Install pnpm globally if not already installed:
```bash
npm install -g pnpm
```

---

### 📥 1. Clone the Repository
```bash
git clone https://github.com/Sanat092004/Jambites-MobileApp.git
cd Jambites-MobileApp
```

---

### 📦 2. Install Dependencies
```bash
pnpm install
```

> ⚠️ This project uses **pnpm workspaces**. Do not use `npm` or `yarn`.

---

### 🔐 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgresql_connection_string
ANTHROPIC_API_KEY=your_claude_api_key
PORT=3000
```

---

### 🗄️ 4. Setup Database
Push the schema to your database:

```bash
pnpm --filter @workspace/db run push
```

---

### ▶️ 5. Start Development Server
```bash
pnpm --filter @workspace/api-server run dev
```

Server will run at:
```
http://localhost:3000/api
```

---

### ✅ 6. Verify Setup

Test the API using curl:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok"
}
```

---

## ⚠️ Notes

- Some endpoints currently use **mock data**
- Mobile app interface is still under development
- Ensure PostgreSQL is running before starting the server
## 📦 Key Modules

### 🧩 `artifacts/api-server`
Main backend service built using Express.

- Handles API routing and middleware  
- Entry point for all backend operations  
- Exposes REST endpoints under `/api`  

---

### 🗄️ `lib/db`
Database layer using Drizzle ORM.

- Defines schema models  
- Manages PostgreSQL connection  
- Handles schema migrations and updates  

---

### 📜 `lib/api-spec`
API contract definition layer.

- Contains OpenAPI 3.1 specification  
- Drives API structure and consistency  
- Used for automatic client generation  

---

### 🔗 `lib/api-client-react`
Frontend API client (auto-generated).

- React Query hooks for API calls  
- Type-safe communication with backend  
- Generated from OpenAPI spec  

---

### ✅ `lib/api-zod`
Validation layer.

- Zod schemas generated from API spec  
- Ensures request/response validation  
- Used across backend services  

---

### 🤖 `lib/integrations/anthropic-ai`
AI integration module.

- Handles interaction with Claude API  
- Provides chatbot functionality (Jammy)  
- Injects runtime context into prompts  

---

### 🛠️ `scripts`
Utility scripts.

- Contains helper scripts for development tasks  
- Used for automation and maintenance  

---

## 🗺️ Roadmap

### ✅ Phase 1 (Completed)
- Backend API setup  
- Database integration  
- API contract system (OpenAPI + codegen)  
- Basic AI chatbot integration  
- Health check endpoint  

---

### 🔄 Phase 2 (In Progress)
- Vendor and menu APIs (mock → real data)  
- Order placement system  
- Basic authentication (OTP-based)  
- Order tracking functionality  

---

### 🧪 Phase 3 (Planned — Subject to Scope)
- Data-driven traffic detection  
- Smart dispatch system  
- Dynamic pricing mechanisms  

---

## ⚠️ Current Limitations

- Mobile app UI is still under development  
- Several endpoints rely on mock data  
- No real-time tracking (simulated responses)  
- AI chatbot is prompt-based (no persistent memory)  

---

## 🎯 Project Objective

This project is focused on:

- Designing scalable backend systems  
- Building type-safe APIs using modern tooling  
- Understanding real-world system architecture  
- Exploring AI integration in applications  

---

## 🚀 Future Improvements

- Replace mock data with live database integration  
- Add payment gateway support  
- Implement real-time communication (WebSockets)  
- Improve AI responses with better context handling  

---

## 📄 License

This project is licensed under the MIT License.
