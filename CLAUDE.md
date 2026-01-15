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
4. ✓ Student Steckbrief (profile with text fields + images, draft/submit workflow, unsaved changes warnings)
5. ✓ Dynamic Steckbrief Field Management (admin can add/edit/reorder/deactivate fields at runtime)
6. Admin Dashboard (review & approval workflow) - **NEXT**
7. Kommentare (student comments about other students)
8. Rankings (student & teacher rankings)
9. Umfragen (surveys/polls)
10. Data export for yearbook printing

## Development Approach

**Iterative, feature-by-feature development:**
- Always propose structure/approach BEFORE implementing
- Wait for explicit approval before writing code
- No over-engineering - implement only requested features
- Keep solutions simple and focused

**Communication style:**
- Keep responses concise to save tokens
- Explain decisions and answer questions clearly, but avoid unnecessary verbosity
- Focus on technical accuracy and implementation details
- Provide clear summaries after completing tasks

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

**Fixing mistakes:**
- If you discover errors in previous commits or a bugfix didn't work, use `git reset` to undo commits
- `git reset HEAD~1` - Undo last commit but keep changes (soft reset)
- `git reset --hard HEAD~1` - Undo last commit and discard all changes (hard reset)
- `git stash` - Temporarily save changes without committing (useful after reset if you want to start fresh)
- Always verify the commit history with `git log` before resetting
- Only reset commits that haven't been pushed to remote, or explicitly confirm with user first

## Project Structure

```
app/                        # Next.js App Router
├── (auth)/                # Auth routes (Login, Register)
├── (student)/             # Student-facing pages (Dashboard, Steckbrief, Settings)
│   ├── dashboard/         # Student dashboard with status overview
│   ├── steckbrief/        # Steckbrief editor page
│   └── einstellungen/     # Student settings
├── admin/                 # Admin pages (Dashboard, User Management, Settings)
│   ├── benutzer/          # User management pages
│   ├── steckbrief-felder/ # Dynamic field management
│   ├── steckbriefe/       # Profile review pages (TODO)
│   └── einstellungen/     # Admin settings
└── api/                   # API routes
    ├── auth/              # NextAuth endpoints
    ├── settings/          # Profile & password update endpoints
    ├── admin/
    │   ├── users/         # Admin user management endpoints
    │   └── steckbrief-fields/ # Dynamic field management endpoints
    ├── steckbrief/        # Steckbrief CRUD + submit/retract endpoints
    └── register/          # User registration endpoint

components/
├── ui/                    # Base UI components (Button, Card, Input, ErrorMessage, ConfirmDialog)
├── auth/                  # Auth components (LoginForm, RegisterForm, LogoutButton)
├── settings/              # Settings forms (ProfileSettingsForm, PasswordChangeForm)
├── steckbrief/            # Steckbrief components
│   ├── SteckbriefForm.tsx           # Main form with state management
│   ├── FieldRenderer.tsx            # Dynamic field rendering
│   ├── SingleImageUpload.tsx        # Single image upload component
│   ├── MultiImageUpload.tsx         # Multi-image upload with incremental logic
│   └── SteckbriefStatusActions.tsx  # Dashboard status action buttons
├── admin/                 # Admin components
│   ├── UserManagement, UserForm, UserList
│   └── steckbrief-fields/ # FieldManagement, FieldList, FieldForm
├── navigation/            # Navigation components (StudentNav, AdminNav)
└── providers/             # React providers (SessionProvider)

hooks/
└── useUnsavedChangesWarning.tsx  # Intercepts navigation with unsaved changes

lib/
├── prisma.ts                      # Prisma client singleton
├── auth.ts                        # NextAuth configuration with session update handling
├── auth.config.ts                 # NextAuth config (middleware, callbacks)
├── validation.ts                  # Zod schemas for validation
├── steckbrief-validation-dynamic.ts # Dynamic Zod schema generation from DB fields
└── file-upload.ts                 # File validation, save, and delete utilities

types/
└── next-auth.d.ts         # NextAuth type extensions for User & Session

prisma/
├── schema.prisma          # Database schema (User, Profile with status & images)
├── seed.ts                # Seed data for development
└── migrations/            # Database migrations
```

## Key Schema Concepts

- **User:** Authentication & role management (STUDENT, ADMIN)
  - `active` field for soft delete (deactivated users can't log in)
  - Stores firstName, lastName, email, password (bcrypt hashed)
- **Profile/Steckbrief:** Student yearbook profile
  - One-to-one relationship with User (userId unique)
  - Automatically created for STUDENT role users
  - Status: DRAFT | SUBMITTED | APPROVED (enum ProfileStatus)
  - Feedback: String? @db.Text (admin comments for rejected submissions)
  - `values` relation to SteckbriefValue (dynamic field values)
- **SteckbriefField:** Dynamic field definitions (admin-configurable)
  - key: unique identifier (immutable after creation)
  - type: TEXT | TEXTAREA | SINGLE_IMAGE | MULTI_IMAGE
  - label, placeholder, maxLength, maxFiles, rows, required, order
  - active: soft-delete flag (deactivated fields are hidden but data preserved)
- **SteckbriefValue:** Field values per student
  - profileId + fieldId unique constraint (one value per field per student)
  - textValue, imageValue, imagesValue (depending on field type)
- **Status tracking:** DRAFT → SUBMITTED → APPROVED workflow (with retract option)
- **Admin feedback:** Comments for rejected submissions, cleared on retract

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

## Student Steckbrief Feature (Implemented)

**Overview:**
Students can create and edit their yearbook profiles with text fields and images. The feature uses a **database-driven dynamic field system** that allows admins to configure fields at runtime.

**Key Architecture:**

### 1. Dynamic Field System
- **Database-driven:** Field definitions stored in `SteckbriefField` table
- **Admin UI:** `/admin/steckbrief-felder` for CRUD operations
- **Field types:** TEXT, TEXTAREA, SINGLE_IMAGE, MULTI_IMAGE
- **Runtime configuration:** Add/edit/reorder/deactivate fields without code changes
- **Soft-delete:** Deactivated fields are hidden, data preserved for reactivation
- **Dynamic validation:** Zod schemas generated from field definitions

### 2. File Upload System
- **Storage:** `public/uploads/profiles/{userId}/{filename}`
- **Filename format:** `{fieldKey}-{timestamp}-{random}.{ext}`
- **Validation:** Client + server side (max 5MB, JPG/PNG/WebP only)
- **Utilities:** `lib/file-upload.ts` provides validateImageFile, saveImageFile, deleteImageFile

### 3. Multi-Image Upload
- **Incremental uploads:** Distinguishes between existing (saved) URLs and new files
- **State management:** Two separate lists - `existing: string[]` and `new: File[]`
- **API communication:** FormData sends `existing_{fieldKey}` (JSON) + `new_{fieldKey}` (Files)
- **Individual deletion:** Each image (existing or new) can be removed independently
- **Configurable limit:** maxFiles per field (default 3)

### 4. Workflow States
- **DRAFT:** Student can edit freely
- **SUBMITTED:** Locked for editing, awaiting admin review
- **APPROVED:** Final state, content goes to yearbook
- **Retract:** Students can retract submissions (SUBMITTED → DRAFT)

### 5. User Experience
- **ConfirmDialog:** All destructive actions (retract, remove image) use design-consistent dialogs
- **Unsaved changes warning:**
  - Browser-native dialogs for all navigation attempts (consistent UX)
  - Intercepts link clicks with `useUnsavedChangesWarning` hook
  - Tracks changes with `lastSavedState` (not just initial)
- **Visual feedback:** "Neu" label on unsaved images, removed after save without reload
- **Auto-sync:** State updates immediately after save, no manual refresh needed
- **Feedback display:** Shows admin feedback when profile was rejected

### 6. Default Fields (Admin-Configurable)
1. **Profilbild** (SINGLE_IMAGE) - Profile picture
2. **Lieblingszitat** (TEXTAREA, max 500 chars) - Favorite quote
3. **Pläne nach dem Abi** (TEXTAREA, max 1000 chars) - Plans after graduation
4. **Schönste Erinnerung** (TEXTAREA, max 1000 chars) - Best memory
5. **Erinnerungsfotos** (MULTI_IMAGE, max 3) - Memory photos

### 7. API Endpoints

**Student Steckbrief:**
- `GET /api/steckbrief` - Load profile with fields and values
- `PATCH /api/steckbrief` - Update draft (dynamic field handling)
- `POST /api/steckbrief/submit` - Submit for review (DRAFT → SUBMITTED)
- `POST /api/steckbrief/retract` - Retract submission (SUBMITTED → DRAFT)

**Admin Field Management:**
- `GET /api/admin/steckbrief-fields` - List all fields (including inactive)
- `POST /api/admin/steckbrief-fields` - Create new field
- `PATCH /api/admin/steckbrief-fields/[fieldId]` - Update field
- `PATCH /api/admin/steckbrief-fields/reorder` - Bulk reorder fields

### 8. Security Measures
- File size limits (5MB)
- MIME type validation (server-side)
- Extension whitelist
- Unique filenames (prevents overwrites)
- User-specific directories (prevents path traversal)
- Session-based auth (users can only edit their own Steckbrief)
- Status checks (no editing after submission)
- Admin-only field management

## File Upload Handling

- Profile images stored in `public/uploads/profiles/{userId}/`
- Filename format: `{fieldName}-{timestamp}-{random}.{ext}` ensures uniqueness
- Validation: max 5MB, JPG/PNG/WebP only
- Utilities in `lib/file-upload.ts` handle all file operations
- Old images are deleted when replaced

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

# Serena
When the Serena-mcp is available, it should always be used to its full extent.
If you are unsure about how to use it or if it is the beginning of a conversation, use the "initial_instructions" tool to get a better picture.
