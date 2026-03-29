🍔 Jambites — Food Delivery During Traffic Jams

Jambites is a system designed to deliver snacks, beverages, and essential medicines directly to users stuck in traffic.
The goal is to turn idle time in traffic into a convenient ordering experience.

This repository contains the backend system and core platform logic built using a TypeScript monorepo architecture. The mobile app interface is under development within this same repository.

🧩 Problem Statement

Urban traffic congestion leads to:

Long idle times for commuters

Limited access to food or essentials during travel

Poor utilization of vendor reach during peak hours

Jambites addresses this by enabling location-based ordering during traffic conditions.

🏗️ System Architecture

This project is structured as a pnpm workspace monorepo:

Jambites-MobileApp/
├── artifacts/
│   ├── api-server/           # Express backend API
│   └── mockup-sandbox/       # UI prototypes (WIP)
├── lib/
│   ├── db/                   # Database schema (Drizzle ORM)
│   ├── api-spec/             # OpenAPI specification
│   ├── api-client-react/     # Generated API client
│   ├── api-zod/              # Validation schemas
│   └── integrations/
│       └── anthropic-ai/     # AI chatbot integration
├── scripts/
├── tsconfig files
└── pnpm workspace config
🛠️ Tech Stack
Layer	Technology
Backend	Node.js + Express 5
Language	TypeScript
Database	PostgreSQL + Drizzle ORM
Validation	Zod
API Spec	OpenAPI 3.1 + Orval
AI	Anthropic Claude API
Build Tool	esbuild
Package Manager	pnpm
⚙️ Core Features (Implemented)
✅ Backend API (Phase 1)

Express-based REST API

Health check endpoint (/api/health)

Modular route structure

Type-safe schema validation using Zod

✅ Database Layer

PostgreSQL integration

Schema management via Drizzle ORM

✅ API Contract System

OpenAPI specification

Auto-generated API client (React Query)

Shared schema validation

✅ AI Chatbot (Jammy)

Claude-powered chatbot

Handles:

Basic query responses

Order-related context prompts

Menu suggestions (prompt-based)

Note: AI is currently prompt-driven and does not include persistent memory or advanced reasoning.

✅ Jam Simulation

Time-based heuristic to simulate traffic conditions:

Morning: 8–10 AM

Evening: 6–8 PM

🚧 Work in Progress
🔄 Mobile App Interface

UI currently in development within mockup-sandbox

No production-ready mobile build yet

🧪 Example System Flow
1. User location is captured
2. System checks for traffic (simulated)
3. Nearby vendors are fetched
4. User selects items from menu
5. Order is placed via API
6. Order status can be tracked
🔌 API Endpoints
Method	Endpoint	Status
GET	/api/health	✅ Implemented
GET	/api/vendors/nearby	🔄 Planned
GET	/api/vendors/:id/menu	🔄 Planned
POST	/api/orders	🔄 Planned
GET	/api/orders/:id/status	🔄 Planned
POST	/api/auth/otp/send	🔄 Planned
⚙️ Setup & Installation
Prerequisites

Node.js (v18+ recommended)

pnpm

PostgreSQL database

1. Clone the repository
git clone https://github.com/Sanat092004/Jambites-MobileApp.git
cd Jambites-MobileApp
2. Install dependencies
pnpm install
3. Configure environment variables

Create a .env file:

DATABASE_URL=your_postgres_url
ANTHROPIC_API_KEY=your_api_key
PORT=3000
4. Setup database
pnpm --filter @workspace/db run push
5. Start development server
pnpm --filter @workspace/api-server run dev
6. Test API
curl http://localhost:3000/api/health
📦 Key Modules
api-server

Handles routing, middleware, and API endpoints.

lib/db

Database schema and connection.

lib/api-spec

Defines API contracts and generates clients.

lib/api-zod

Runtime validation schemas.

anthropic-ai

Integration layer for chatbot functionality.

🗺️ Roadmap
Phase 1 (Completed)

Backend setup

Database integration

API structure

Basic AI chatbot

Phase 2 (In Progress)

Vendor & menu APIs

Order placement system

Authentication (OTP-based)

Basic order tracking

Phase 3 (Planned — Subject to Scope)

Traffic prediction models

Smart dispatch system

Dynamic pricing

⚠️ Current Limitations

Mobile app not fully implemented

Most business logic endpoints are in development

Traffic detection is simulated, not real-time

AI chatbot is prompt-based (no long-term memory)

🎯 Project Goal

This project focuses on:

Learning scalable backend architecture

Building type-safe APIs

Integrating AI into real-world workflows

📄 License

MIT
