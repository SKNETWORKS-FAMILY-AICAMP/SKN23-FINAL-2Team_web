# Cadence AI - Web Frontend

## Project Overview
**Cadence AI** is an AI-powered CAD assistant platform designed to ensure legal compliance and precision in architectural, electrical, fire safety, and piping designs. It acts as an intelligent co-pilot that analyzes CAD drawings and provides real-time feedback and automated correction suggestions.

### Core Technologies
- **Frontend Framework:** React (v18/19) with TypeScript
- **Build Tool:** Vite (v6)
- **Styling:** Tailwind CSS (v4) with CSS-in-JS (Emotion) and Motion (framer-motion)
- **UI Components:** Shadcn UI (Radix UI primitives) and Material UI (MUI)
- **3D Visuals:** Spline (@splinetool/react-spline)
- **Routing:** React Router (v7)
- **Icons:** Lucide-React
- **State Management:** React Context (AuthContext)

### Architecture
- **`src/app/components`**: Contains reusable UI components, authentication modals, and domain-specific components.
- **`src/app/context`**: Context providers for global state (e.g., `AuthContext`).
- **`src/app/pages`**: Main page components (`App.tsx` as landing, `PaymentPage`, `ProfilePage`).
- **`src/styles`**: Centralized styling using Tailwind and theme-specific CSS.
- **`src/assets`**: Assets managed by a custom `figma-asset-resolver` Vite plugin.

---

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- `npm` or `pnpm`

### Installation
```bash
npm install
# or
pnpm install
```

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.
*Note: The frontend expects a backend server running at `http://localhost:8000` for authentication and data.*

### Production Build
```bash
npm run build
```
Outputs the production-ready build to the `dist` directory.

---

## Development Conventions

### Styling & UI
- **Tailwind CSS:** Use Tailwind for utility-based styling.
- **Motion:** Use `motion/react` (Framer Motion) for complex scroll-based and entry animations.
- **Shadcn UI:** Reusable UI components are located in `src/app/components/ui`. Always prefer these over raw HTML or external libraries if possible.
- **Dark Mode:** The application defaults to dark mode (`dark` class on the root container).

### Component Structure
- Use functional components with TypeScript interfaces for props.
- Keep components small and focused.
- Place logic in hooks or context if it needs to be shared across components.

### Path Aliases
- Use the `@` alias to refer to the `src` directory (e.g., `import { Button } from '@/app/components/ui/button'`).

### Authentication
- Authentication is managed via `AuthContext`.
- Tokens are stored in `localStorage` (`access_token`, `refresh_token`).
- Use the `useAuth` hook to access user state and authentication methods.

---

## Project Status
The project is currently in active development, focusing on the precision engine integration and user dashboard functionalities.
