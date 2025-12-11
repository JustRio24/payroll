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
- **State Management**: React Context API (`AppProvider` in `lib/store.tsx`) with local state for demo data
- **Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with tsx for development
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Static Serving**: Express static middleware for production builds

### Data Storage
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`
- **Database**: MySQL (migrated from PostgreSQL) using mysql2/promise driver
- **Connection**: Connection pooling configured in `server/db.ts`
- **Schema**: Currently defines `users` table with auto-increment IDs

Note: The current implementation uses in-memory mock data in the frontend store for demo purposes. The MySQL storage layer is set up but routes need to be connected.

### Key Design Decisions

1. **Monorepo Structure**: Client (`client/`), server (`server/`), and shared code (`shared/`) in one repository with path aliases
2. **Shared Types**: Database schemas in `shared/schema.ts` using Drizzle with Zod validation via `drizzle-zod`
3. **Component Library**: shadcn/ui components in `client/src/components/ui/` for consistent design
4. **Geofencing**: Office location hardcoded at coordinates (-2.9795731113284303, 104.73111003716011) with 100m radius
5. **File Storage**: Local `/uploads` directory planned for photos and attachments (not cloud-based)

### Build & Development
- Development: `npm run dev` runs tsx with the Express server
- Client Dev: Vite dev server with HMR via `setupVite()`
- Production: esbuild bundles server, Vite builds client to `dist/`

## External Dependencies

### Database
- **MySQL**: Primary database via mysql2/promise driver
- **Drizzle ORM**: Type-safe database operations
- Environment variables: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`

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
- **connect-pg-simple**: PostgreSQL session store (legacy, may need MySQL equivalent)
- **express-session**: Server-side session handling