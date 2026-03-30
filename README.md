# GlobeGenie — AI Travel Planner PWA

<p align="center">
  <strong>Plan magical trips with AI-powered itineraries, smart budgeting, and collaborative travel planning.</strong>
</p>

---

## 🌍 Overview

GlobeGenie is a Progressive Web App (PWA) that helps travelers plan, organize, and manage trips end-to-end. Built with React, TypeScript, Vite, and Tailwind CSS, it delivers a native mobile experience directly from the browser.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Chat Planner** | Conversational trip planning wizard that collects preferences and generates itineraries |
| **Smart Itinerary Builder** | Day-by-day itinerary with drag-and-drop reordering, activity details, and travel times |
| **Trip Planning Wizard** | Step-by-step form: destination, dates, companions, purpose, experiences, pace & budget |
| **Hotel Search & Booking** | Browse hotels with filters (price, rating, amenities, star class) and room details |
| **Budget & Expense Tracker** | Track expenses by category, set budgets, split costs among travelers |
| **Reservations Manager** | Log flights, hotels, rental cars, restaurants, trains, buses, ferries & more |
| **Document Attachments** | Upload and manage trip-related documents and files |
| **Journal / Notes** | Personal travel journal per trip |
| **Explore Content** | Discover travel blogs, food guides, and cinematic travel videos |
| **Collaboration & Sharing** | Invite fellow travelers to view or edit shared trips |
| **PWA / Installable** | Add to home screen on iOS & Android with offline-ready architecture |

## 📱 PWA Capabilities

- **Installable** — Add to home screen on iOS (Safari) and Android (Chrome)
- **Install Prompt** — Auto-shows install banner on mobile with platform-specific guidance
- **Standalone Mode** — Runs full-screen like a native app with status bar theming
- **Safe Area Support** — Handles notched devices (iPhone X+, Android punch-hole)
- **Service Worker** — Auto-update strategy with production-only activation

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS + shadcn/ui components |
| **Animations** | Framer Motion |
| **Routing** | React Router v6 |
| **State** | React Context + TanStack Query |
| **Drag & Drop** | @hello-pangea/dnd |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Icons** | Lucide React |
| **Fonts** | DM Sans (body) + Playfair Display (headings) |

## 📂 Project Structure

```
src/
├── assets/              # Logo and hero images
├── components/
│   ├── ui/              # shadcn/ui component library
│   ├── Navbar.tsx        # Top navigation bar
│   ├── BottomNav.tsx     # Mobile bottom tab bar
│   ├── InstallPrompt.tsx # PWA install prompt banner
│   ├── AuthDialog.tsx    # Sign-in/sign-up dialog
│   ├── AddActivityDialog.tsx
│   └── ActivityDetailDialog.tsx
├── contexts/
│   └── AuthContext.tsx   # Authentication state
├── data/
│   ├── destinations.ts   # Country → city mapping
│   └── hotels.ts         # Hotel mock data
├── hooks/
│   └── use-mobile.tsx    # Mobile breakpoint hook
├── pages/
│   ├── Index.tsx         # Landing / home page
│   ├── Login.tsx         # Phone OTP + Google login
│   ├── Signup.tsx        # Registration
│   ├── Chat.tsx          # AI trip planning chat
│   ├── PlanTrip.tsx      # Step-by-step trip wizard
│   ├── Itinerary.tsx     # Full itinerary manager
│   ├── Account.tsx       # User dashboard + saved trips
│   ├── EditProfile.tsx   # Profile editor + password reset
│   ├── Hotels.tsx        # Hotel search & filter
│   ├── HotelDetail.tsx   # Hotel detail + room booking
│   ├── Explore.tsx       # Travel blogs & videos
│   └── NotFound.tsx      # 404 page
└── lib/
    └── utils.ts          # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / bun / pnpm

### Install & Run
```bash
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

### Build for Production
```bash
npm run build
npm run preview
```

## 🔐 Demo Credentials

The app currently uses mock authentication:

| Field | Value |
|-------|-------|
| **Phone** | `123456789` |
| **OTP** | `0987` |

## 🗺 Roadmap — Backend Integration

The app is currently fully client-side with mock data. See [`/mnt/documents/Backend-Requirement-Readme.md`](./Backend-Requirement-Readme.md) for the complete backend requirements document covering:

- Supabase database schema (15+ tables)
- Authentication (Phone OTP, Google OAuth, Apple Sign-In)
- AI itinerary generation (OpenAI / Gemini)
- Google Places API integration
- Real-time collaboration
- Push notifications
- File storage
- Edge functions

## 📄 License

Private — All rights reserved.
