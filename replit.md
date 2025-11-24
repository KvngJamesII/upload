# OTP King - Virtual SMS Numbers Platform

## Overview

OTP King is a web application that provides virtual phone numbers for SMS verification and OTP (One-Time Password) reception. The platform features a dual-interface system: a user-facing homepage for browsing and using virtual numbers from different countries, and an administrative panel for managing numbers, users, and system settings.

The application allows users to:
- Browse virtual numbers by country
- Receive SMS messages on temporary numbers
- Track their usage history
- Earn credits through referrals

Administrators can:
- Upload and manage phone number pools by country
- Monitor user activity and statistics
- Configure SMS API integrations
- Send notifications and announcements
- Toggle maintenance mode
- Manage user accounts (ban/unban)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: shadcn/ui (Radix UI primitives) with Tailwind CSS
- Design system follows Material Design 3 principles with modern dashboard aesthetics
- Responsive design with mobile-first approach
- Theme system supporting light/dark modes via context provider
- Component library includes forms, dialogs, cards, tables, and navigation elements

**Routing**: Wouter (lightweight client-side routing)
- Public routes: `/login`, `/signup`, `/maintenance`
- Protected user routes: `/` (home), `/country/:id`, `/profile`, `/history`
- Admin routes: `/admin/*` with nested subroutes for different management panels

**State Management**: 
- TanStack Query (React Query) for server state and data fetching
- React Context for theme preferences
- Session-based authentication state via API queries

**Key UI Patterns**:
- Fixed header navigation with profile, notifications, and credits display
- Scrolling announcement banner with marquee animation
- Country selection cards with flag imagery and usage statistics
- Admin sidebar navigation with expandable/collapsible states
- Rate-limited action buttons (Next Number, Check SMS)

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**Development vs Production**:
- Development: Vite dev server integrated as Express middleware with HMR
- Production: Static file serving of pre-built client assets

**Session Management**:
- express-session with connect-pg-simple for PostgreSQL-backed sessions
- Passport.js with LocalStrategy for username/password authentication
- Session cookies with secure configuration

**Authentication Flow**:
- bcrypt password hashing (salt rounds: 10)
- IP address tracking on signup/login
- Admin vs regular user role separation
- Middleware guards: `requireAuth` and `requireAdmin`

**Rate Limiting**:
- express-rate-limit implementation
- Per-endpoint limiters (number fetching, SMS checking)
- 10 requests per minute for number operations
- 20 requests per minute for SMS checks

**API Structure**:
- RESTful endpoints under `/api` prefix
- Authentication: `/api/auth/*` (login, signup, logout, me)
- Countries: `/api/countries/*`
- SMS: `/api/sms/:phoneNumber`
- User data: `/api/history`, `/api/notifications`
- Admin: `/api/admin/*` (users, announcements, settings, maintenance)

### Data Storage

**Database**: PostgreSQL via Neon serverless driver

**ORM**: Drizzle ORM with schema-first approach

**Schema Design**:

1. **users** - User accounts with authentication, credits, referral system, ban status
2. **countries** - Country metadata with phone number pools stored as text files
3. **numberHistory** - Tracks which users used which numbers and when
4. **smsMessages** - Stores received SMS (sender, message, timestamp) per phone number
5. **announcements** - Admin-created scrolling banner messages
6. **notifications** - User notifications (read/unread status)
7. **settings** - System configuration (API tokens, maintenance mode)

**Key Relationships**:
- Users → numberHistory (one-to-many)
- Countries → numberHistory (one-to-many)
- Referral system via users.referredBy self-reference

**Data Patterns**:
- Phone numbers stored as newline-separated text in countries.numbersFile
- Random number selection from available pool
- Increment usedNumbers counter on each use
- SMS messages linked by phoneNumber string (not foreign key)

### External Dependencies

**Third-Party Services**:
- SMS panel API integration (configurable via admin panel)
  - API token stored in settings table
  - Used to check for incoming SMS messages
  - Subject to change, hence admin-configurable

**Database Hosting**: 
- Neon PostgreSQL (serverless/connection pooling)
- WebSocket support via ws package for serverless connections

**UI Libraries**:
- Radix UI primitives (@radix-ui/react-*) for accessible components
- Tailwind CSS for styling
- class-variance-authority for component variants
- lucide-react for icons

**Validation & Forms**:
- Zod schemas for input validation (shared between client/server)
- React Hook Form with Zod resolver
- drizzle-zod for database schema validation

**Development Tools**:
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
- TypeScript strict mode enabled
- Path aliases: `@/` (client), `@shared/` (shared schemas)

**Build & Deployment**:
- Vite for client bundling
- esbuild for server bundling
- Server runs on port determined by environment
- Static assets served from dist/public in production

## Recent Fixes & Features (Latest Session)

### 1. Admin Panel Routing Fixed
- Fixed wouter route patterns for nested admin routes
- Routes now properly match `/admin` and `/admin/:rest*` for all sub-pages
- Admin sidebar navigation now fully functional without 404 errors

### 2. Notification Mark-as-Read Feature
- Added endpoint: `POST /api/notifications/:id/read` to mark notifications as read
- Updated header notification dropdown with click handlers
- Badge disappears when user clicks notification to mark it as read
- Visual indicator (red dot) shows unread notifications
- Cache invalidation ensures badge updates immediately

### 3. Admin Functionality Status
All admin features are fully implemented and working:
- **Announcements**: Create, Edit, Delete, Toggle Active (all working)
- **Notifications**: Broadcast to all users (working)
- **API Settings**: Save SMS panel API token (working)
- **Wallet Management**: View stats, set credit pricing (working)
- **Gift Codes**: Create codes with expiry/limits, user claims (working)
- **User Management**: View users, ban/unban (working)
- **Statistics**: Dashboard with usage analytics (working)
- **Countries**: Upload numbers, manage pools (working)

### Important Notes for Testing
- To test admin functionality: **Log in as admin** (username: idledev, password: 200715)
- All endpoints require admin authentication via `requireAdmin` middleware
- Session-based authentication persists across navigation
- Admin panel data auto-refreshes via React Query cache invalidation