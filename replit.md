# Overview

Court Piece is a real-time multiplayer card game web application implementing the traditional "Rung" game with three variations: Single Sar, Double Sar, and Hidden Trump. The application features a full-stack architecture with React frontend, Express backend, WebSocket communication for real-time gameplay, and PostgreSQL database for persistent storage. The game supports 4-player teams with bidding mechanics, trump card reveals, and trick-taking gameplay.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **Routing**: Wouter for client-side routing with lobby and game pages
- **State Management**: React Context API for game state with useReducer for complex state transitions
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **Real-time Communication**: Custom WebSocket hook for bidirectional game communication
- **Data Fetching**: TanStack Query for server state management and API calls
- **Styling**: Tailwind CSS with custom CSS variables for theming and card game specific styles

## Backend Architecture
- **Framework**: Express.js with TypeScript for the HTTP server
- **Real-time Communication**: WebSocket server using 'ws' library for game state synchronization
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **Storage Pattern**: In-memory storage fallback with interface-based design for easy database migration
- **Session Management**: Planned integration with connect-pg-simple for PostgreSQL-backed sessions
- **Development Setup**: Hot reload with Vite middleware integration for seamless development

## Game Logic Architecture
- **Game State Management**: Centralized state stored in database with real-time synchronization
- **Player Management**: Four-player teams (A/B) with position-based seating arrangement
- **Card Management**: Standard 52-card deck with rank-based scoring and suit-following rules
- **Phase Management**: Bidding phase followed by playing phase with turn-based mechanics
- **Trump System**: Hidden trump mechanism with reveal conditions and suit precedence

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: Normalized tables for users, games, and players with JSONB for flexible game state
- **Migration Strategy**: Drizzle-kit for database schema management and version control
- **Connection Management**: Neon serverless driver for connection pooling and serverless compatibility

## Authentication and Authorization
- **User System**: Username-based authentication with password storage
- **Session Management**: Express sessions with PostgreSQL backing store
- **Game Access**: Player-based authorization with game ID and player ID validation
- **Real-time Security**: WebSocket connection validation with player identity verification

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations with automatic migration generation
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Frontend Libraries
- **Radix UI**: Headless UI components for accessibility and consistent behavior
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing library for single-page application navigation
- **Embla Carousel**: Touch-friendly carousel component for card displays

## Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for low-latency game updates
- **Custom WebSocket Hook**: Abstracted WebSocket management with automatic reconnection

## Development Tools
- **Vite**: Fast development server with hot module replacement
- **TypeScript**: Type safety across frontend and backend with shared type definitions
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimization with cartographer and error overlay plugins