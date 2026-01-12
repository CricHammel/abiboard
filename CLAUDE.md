# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Abibuch (yearbook) management web application** for a German high school graduating class. The app allows students to manage their profiles and admins (Abi-Komitee) to review and approve content before it goes into the yearbook.

**Important:** This is NOT a public application - it's internal for one graduating class only.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Auth.js / NextAuth (Credentials provider with email + password)

## Language Convention

- **All code:** English (variables, functions, types, comments)
- **All user-facing content:** German (UI text, labels, error messages, validation messages)
- **This includes:** API responses shown to users, form labels, button text, notifications

## Architecture

### User Roles
- **STUDENT:** Can edit their own profile/Steckbrief, view limited content
- **ADMIN:** Full access to all profiles, can approve/reject submissions, manage all content

### Core Data Flow
1. Students create/edit their Steckbrief (profile)
2. Students submit for review (status: DRAFT → SUBMITTED)
3. Admins review submissions in dashboard
4. Admins approve or reject (SUBMITTED → APPROVED or back to DRAFT with feedback)

### Planned Features (Implementation Order)
1. ✓ Authentication & User Management
2. ✓ Admin User Management (create/edit users, soft delete with active field)
3. ✓ Settings Pages (profile & password management for students and admins)
4. Student Steckbrief (profile with text fields + image) - **IN PROGRESS**
5. Admin Dashboard (review & approval workflow)
6. Kommentare (student comments about other students)
7. Rankings (student & teacher rankings)
8. Umfragen (surveys/polls)
9. Data export for yearbook printing

## Development Approach

**Iterative, feature-by-feature development:**
- Always propose structure/approach BEFORE implementing
- Wait for explicit approval before writing code
- No over-engineering - implement only requested features
- Keep solutions simple and focused

## Design System

**ALL UI components must follow the design system documented in DESIGN.md:**
- Minimalist and functional design
- Mobile-first approach
- Consistent colors, typography, and spacing
- Touch-friendly (min 44px click targets)
- Accessible (WCAG AA)
- Refer to DESIGN.md for all design decisions, component styles, and patterns

## Version Control

**Git workflow:**
- Commit after each meaningful feature or change
- Use descriptive commit messages in English
- Create commits regularly to track progress
- `.gitignore` should exclude: `node_modules/`, `.env*`, `.next/`, `uploads/` (user-generated content)

## Project Structure

```
app/                        # Next.js App Router
├── (auth)/                # Auth routes (Login, Register)
├── (student)/             # Student-facing pages (Dashboard, Settings)
├── admin/                 # Admin pages (Dashboard, User Management, Settings)
│   ├── benutzer/          # User management pages
│   ├── steckbriefe/       # Profile review pages
│   └── einstellungen/     # Admin settings
└── api/                   # API routes
    ├── auth/              # NextAuth endpoints
    ├── settings/          # Profile & password update endpoints
    ├── admin/users/       # Admin user management endpoints
    └── register/          # User registration endpoint

components/
├── ui/                    # Base UI components (Button, Card, Input, ErrorMessage)
├── auth/                  # Auth components (LoginForm, RegisterForm, LogoutButton)
├── settings/              # Settings forms (ProfileSettingsForm, PasswordChangeForm)
├── admin/                 # Admin components (UserManagement, UserForm, UserList, ConfirmDialog)
├── navigation/            # Navigation components (StudentNav, AdminNav)
└── providers/             # React providers (SessionProvider)

lib/
├── prisma.ts              # Prisma client singleton
├── auth.ts                # NextAuth configuration with session update handling
├── auth.config.ts         # NextAuth config (middleware, callbacks)
└── validation.ts          # Zod schemas for validation

types/
└── next-auth.d.ts         # NextAuth type extensions for User & Session

prisma/
├── schema.prisma          # Database schema (User with active field, Profile with status)
├── seed.ts                # Seed data for development
└── migrations/            # Database migrations
```

## Key Schema Concepts

- **User:** Authentication & role management (STUDENT, ADMIN)
  - `active` field for soft delete (deactivated users can't log in)
  - Stores firstName, lastName, email, password (bcrypt hashed)
- **Profile/Steckbrief:** Student yearbook profile with multiple text fields + image
  - One-to-one relationship with User
  - Automatically created for STUDENT role users
- **Status tracking:** DRAFT → SUBMITTED → APPROVED workflow
- **Admin feedback:** Comments for rejected submissions

## Database Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

## Development Server

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Authentication Flow

- Uses NextAuth v5 with Credentials provider (no OAuth)
- Email + password only (bcrypt with 10 rounds)
- JWT strategy with session tokens
- Role-based access control via middleware
- Protected routes for student and admin areas
- Session update handling:
  - Profile changes update JWT token and session without re-login
  - Use `useSession().update()` to trigger session updates
  - JWT and session callbacks handle `trigger === "update"`
- Inactive users (active: false) are blocked at login

## File Upload Handling

- Profile images stored in `public/uploads/`
- Implement file size and type validation
- Generate unique filenames to prevent conflicts

## Important Implementation Notes

### Next.js 15+ Dynamic Routes
In Next.js 15+, route parameters are now Promises and **must be awaited**:

```typescript
// API Routes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Must await!
  // ... use id
}

// Pages
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;  // Must await!
  // ... use id
}
```

### Session Updates
When updating user profile data (firstName, lastName, email):
1. Update database via API
2. Call `useSession().update({ ...newData })` in client component
3. JWT and session callbacks handle the update automatically

### Soft Delete Pattern
- Never delete users from database
- Set `active: false` instead
- Middleware and auth checks verify `active` status
- Inactive users cannot log in
