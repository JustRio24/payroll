# PT Panca Karya Utama - Payroll & HRIS System

## Overview

A fullstack web application for managing payroll and attendance (HRIS) for PT Panca Karya Utama, a construction company. The system provides:

- **Employee Management**: CRUD operations for employee data and positions
- **Attendance Tracking**: Geofence-based clock-in/out with photo verification
- **Leave Management**: Request and approval workflow for time off
- **Payroll Processing**: Salary calculation, deductions, and payslip generation
- **Reporting**: PDF/Excel exports for attendance and payroll data

The application supports two roles: Admin (full management access) and Employee (self-service portal).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Context API (`AppProvider` in `lib/store.tsx`) with API-based data fetching
- **Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with tsx for development
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Static Serving**: Express static middleware for production builds

### Data Storage (Dual Mode)
- **Primary**: MySQL via mysql2/promise driver with Drizzle ORM
- **Fallback**: In-memory storage (MemStorage) when MySQL not available
- **Connection**: Connection pooling configured in `server/db.ts`
- **Schema**: Defined in `shared/schema.ts` with Drizzle tables

The system automatically detects MySQL availability and falls back to in-memory storage with demo data when MySQL is not accessible (e.g., on Replit).

### Key Design Decisions

1. **Monorepo Structure**: Client (`client/`), server (`server/`), and shared code (`shared/`) in one repository with path aliases
2. **Shared Types**: Database schemas in `shared/schema.ts` using Drizzle with Zod validation via `drizzle-zod`
3. **Component Library**: shadcn/ui components in `client/src/components/ui/` for consistent design
4. **Geofencing**: Office location at coordinates (-2.9795731113284303, 104.73111003716011) with 100m radius
5. **Dual Storage**: MySQLStorage for production (XAMPP), MemStorage for demo/development
6. **Auto-increment IDs**: Using integers instead of UUIDs for MySQL compatibility

### Build & Development
- Development: `npm run dev` runs tsx with the Express server
- Client Dev: Vite dev server with HMR via `setupVite()`
- Production: esbuild bundles server, Vite builds client to `dist/`

## External Dependencies

### Database
- **MySQL**: Primary database via mysql2/promise driver (for local XAMPP)
- **Drizzle ORM**: Type-safe database operations
- Environment variables: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`
- Set `USE_MEMORY_STORAGE=true` to force in-memory mode

### PDF Generation
- **jsPDF**: Client-side PDF generation for payslips and reports
- **jspdf-autotable**: Table formatting in PDFs

### Charts
- **Recharts**: Dashboard visualizations for attendance and payroll metrics

### UI Framework
- **Radix UI**: Headless components (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation
- **class-variance-authority**: Component variant management

### Session Management
- **express-session**: Server-side session handling
- **memorystore**: Session storage (development)

## Security Notes

**IMPORTANT**: Current implementation stores passwords in plain text for demo purposes. For production use:
1. Implement password hashing using bcrypt or similar
2. Add HTTPS for all communications
3. Implement proper session management with secure cookies
4. Add rate limiting on login endpoints

## Quick Start

### Demo Mode (Replit/Development)
1. Run `npm run dev`
2. Application automatically uses in-memory storage with demo data
3. Login with `admin@panca.test` / `password`

### Production Mode (Local MySQL)
1. Install XAMPP and start MySQL
2. Import `database_setup.sql` via phpMyAdmin
3. Configure environment variables (see `MYSQL_SETUP_GUIDE.md`)
4. Run `npm run dev`

### Local Development (Windows/Mac/Linux)
1. Clone or download the repository
2. Run `npm install` to install dependencies
3. For MySQL setup, follow `MYSQL_SETUP_GUIDE.md`
4. Run `npm run dev` to start the development server
5. Access the app at `http://localhost:5000`

**Note**: The project uses `cross-env` for cross-platform environment variable support, so commands work on Windows, Mac, and Linux.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@panca.test | password |
| Employee | budi@panca.test | password |
