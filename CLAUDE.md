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
2. ✓ Student Steckbrief (profile with text fields + image)
3. ✓ Admin Dashboard (review & approval workflow)
4. Kommentare (student comments about other students)
5. Rankings (student & teacher rankings)
6. Umfragen (surveys/polls)
7. Data export for yearbook printing

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
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (Login, Register)
│   ├── (student)/         # Student-facing pages
│   ├── (admin)/           # Admin dashboard
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   └── admin/             # Admin-specific components
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # NextAuth configuration
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Seed data for development
```

## Key Schema Concepts

- **User:** Authentication & role management
- **Profile/Steckbrief:** Student yearbook profile with multiple text fields + image
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

- Uses NextAuth with Credentials provider (no OAuth)
- Email + password only
- Role-based access control via middleware
- Protected routes for student and admin areas

## File Upload Handling

- Profile images stored in `public/uploads/`
- Implement file size and type validation
- Generate unique filenames to prevent conflicts
