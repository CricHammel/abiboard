# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AbiBoard** is an **Abibuch (yearbook) management web application** for a German high school graduating class. The app allows students to manage their profiles, and admins (Abi-Komitee) can track submission progress.

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
- **ADMIN:** Full access to all profiles, can view submission progress, manage all content

### Core Data Flow
1. Students create/edit their Steckbrief (profile)
2. Students submit when done (status: DRAFT → SUBMITTED)
3. Editing after submit automatically resets status to DRAFT (auto-retract)
4. Admins view progress on overview page (no approval workflow)

### Planned Features (Implementation Order)
1. ✓ Authentication & User Management
2. ✓ Whitelist-based Registration (school email required, admin manages student list)
3. ✓ Settings Pages (password management, read-only personal data)
4. ✓ Student Steckbrief (profile with text fields + images, draft/submit workflow, unsaved changes warnings)
5. ✓ Dynamic Steckbrief Field Management (admin can add/edit/reorder/deactivate fields at runtime)
6. ✓ Rankings (student & teacher rankings with gender-specific questions)
7. ✓ Admin Steckbrief-Übersicht (progress tracking, no approval workflow)
8. ✓ Zitate (students collect quotes from teachers AND other students)
9. ✓ Umfragen (anonymous surveys with multiple choice)
10. ✓ Kommentare (student/teacher comments for yearbook)
11. Data export for yearbook printing - **NEXT**

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
- Use git commands without changing directory first. You can act on the assumption that you are always in the root directory
- Generally, you should not need to use the "cd" command in any way

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
├── (student)/             # Student-facing pages
│   ├── dashboard/         # Student dashboard with status overview
│   ├── steckbrief/        # Steckbrief editor page
│   ├── rankings/          # Rankings voting page
│   ├── lehrerzitate/      # Teacher quotes (list + detail)
│   ├── umfragen/          # Survey voting page
│   ├── kommentare/        # Comments page (write comments about others)
│   └── einstellungen/     # Student settings
├── admin/                 # Admin pages
│   ├── schueler/          # Student whitelist management (list, detail, import)
│   ├── lehrer/            # Teacher management (list, import)
│   ├── steckbrief-felder/ # Dynamic field management
│   ├── steckbriefe/       # Steckbrief submission overview
│   ├── ranking-fragen/    # Ranking question management (list, import)
│   ├── rankings/          # Ranking statistics
│   ├── lehrerzitate/      # Teacher quotes admin (list + detail with edit/delete)
│   ├── umfragen/          # Survey question management
│   ├── umfragen-statistik/# Survey statistics
│   ├── kommentare/        # Comments admin (view all, edit, delete)
│   └── einstellungen/     # Admin settings
└── api/                   # API routes
    ├── auth/              # NextAuth endpoints
    ├── settings/          # Password update endpoint
    ├── admin/
    │   ├── students/      # Student whitelist management endpoints
    │   ├── teachers/      # Teacher CRUD + CSV import
    │   ├── steckbrief-fields/ # Dynamic field management endpoints
    │   ├── ranking-questions/ # Question CRUD + reorder + CSV import
    │   ├── rankings/stats/   # Admin statistics endpoints
    │   ├── teacher-quotes/   # Admin teacher quotes (list, detail, edit, delete)
    │   ├── survey-questions/ # Survey CRUD + reorder + stats
    │   └── comments/        # Admin comments (list, edit, delete)
    ├── steckbrief/        # Steckbrief CRUD + submit/retract endpoints
    ├── rankings/          # Student ranking vote/submit/retract + search endpoints
    ├── teacher-quotes/    # Student teacher quotes (list, detail, create, delete own)
    ├── survey/            # Student survey answers
    ├── comments/          # Student comments (CRUD own comments)
    └── register/          # Whitelist-validated registration endpoint

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
├── rankings/              # Student ranking components
│   ├── RankingsPage.tsx             # Main page with progress + submit/retract
│   ├── QuestionCard.tsx             # Single question with autocomplete(s)
│   ├── PersonAutocomplete.tsx       # Debounced search with strict validation
│   └── CandidateList.tsx            # Collapsible inspiration list
├── teacher-quotes/        # Student teacher quotes components
│   ├── TeacherQuoteList.tsx       # Teacher list with sort/search (shared with admin)
│   ├── TeacherQuoteDetail.tsx     # Detail view with own + all quotes
│   └── QuoteInput.tsx             # Textarea bulk input component
├── survey/                # Student survey components
│   ├── SurveyPage.tsx             # Main page with progress
│   └── SurveyQuestionCard.tsx     # Single question with radio buttons
├── comments/              # Student comments components
│   ├── CommentPage.tsx            # Main page with add form + list
│   ├── CommentForm.tsx            # Target selector + autocomplete + textarea
│   └── CommentList.tsx            # List of own comments with edit/delete
├── admin/                 # Admin components
│   ├── StudentManagement, StudentList, StudentForm  # Student whitelist management
│   ├── steckbrief-fields/ # FieldManagement, FieldList, FieldForm
│   ├── teachers/          # TeacherManagement, TeacherList, TeacherForm
│   ├── ranking-questions/ # QuestionManagement, QuestionList, QuestionForm
│   ├── rankings/          # RankingStats
│   ├── teacher-quotes/    # TeacherQuoteAdminDetail (with edit/delete)
│   ├── survey/            # SurveyManagement, SurveyForm, SurveyList, SurveyStats
│   └── comments/          # CommentAdminPage (with filters, inline edit/delete)
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

- **Student:** Whitelist entry for registration
  - firstName, lastName, email (must be @lessing-ffm.net), gender (MALE | FEMALE | null)
  - `active` field for soft delete (deactivated students can't register)
  - `userId` optional relation to User (set after registration)
  - Admin manages via `/admin/schueler` (CRUD + CSV import)
- **User:** Authentication & role management (STUDENT, ADMIN)
  - `active` field for soft delete (deactivated users can't log in)
  - Stores firstName, lastName, email, password (bcrypt hashed)
  - Students: linked to Student entry, name/email are read-only
  - Admins: created only via database seeding
- **Profile/Steckbrief:** Student yearbook profile
  - One-to-one relationship with User (userId unique)
  - Automatically created for STUDENT role users
  - Status: DRAFT | SUBMITTED (enum ProfileStatus)
  - `values` relation to SteckbriefValue (dynamic field values)
- **SteckbriefField:** Dynamic field definitions (admin-configurable)
  - key: unique identifier (immutable after creation)
  - type: TEXT | TEXTAREA | SINGLE_IMAGE | MULTI_IMAGE
  - label, placeholder, maxLength, maxFiles, rows, required, order
  - active: soft-delete flag (deactivated fields are hidden but data preserved)
- **SteckbriefValue:** Field values per student
  - profileId + fieldId unique constraint (one value per field per student)
  - textValue, imageValue, imagesValue (depending on field type)
- **Teacher:** Teacher entries for ranking votes
  - salutation (HERR | FRAU), lastName, optional firstName/subject
  - `active` field for soft delete
  - Admin manages via `/admin/lehrer` (CRUD + CSV import)
- **RankingQuestion:** Admin-configured ranking questions
  - text, type (STUDENT | TEACHER), genderSpecific (boolean), order
  - `active` field for soft delete
  - Admin manages via `/admin/ranking-fragen` (CRUD + reorder + CSV import)
- **RankingVote:** Individual student votes
  - voterId + questionId + genderTarget unique constraint
  - References either a Student (studentId) or Teacher (teacherId)
  - genderTarget: ALL | MALE | FEMALE (for gender-specific questions)
- **RankingSubmission:** Per-user submission status
  - One-to-one with User (userId unique)
  - Status: DRAFT | SUBMITTED (submit/retract workflow)
- **TeacherQuote:** Student-submitted teacher quotes
  - text (max 500 chars), teacherId, userId (submitter), createdAt
  - Hard-delete (no soft-delete, quotes don't need deactivation)
  - Students can only delete their own quotes
  - Admins can edit and delete any quote
- **SurveyQuestion:** Admin-configured survey questions
  - text, order, active (soft-delete)
  - Has many SurveyOptions
- **SurveyOption:** Answer options per question
  - text, order, questionId
  - Cascade-delete when question is deleted
- **SurveyAnswer:** Student answers (anonymous in stats)
  - userId + questionId unique (one answer per question per user)
  - optionId references selected option
  - userId stored for duplicate prevention but never exposed in stats API
- **Comment:** Student comments about other students/teachers
  - text (VarChar 500), authorId, targetStudentId (nullable), targetTeacherId (nullable)
  - Unique constraints: `[authorId, targetStudentId]` and `[authorId, targetTeacherId]`
  - Hard-delete (no soft-delete)
- **Status tracking:** DRAFT → SUBMITTED workflow (auto-retract on edit, explicit retract available)

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
- Inactive users (active: false) are blocked at login

## Whitelist-based Registration

**Overview:**
Students can only register if their school email is in the whitelist (Student table). This ensures only authorized students can create accounts.

**Registration Flow:**
1. Student enters email (@lessing-ffm.net) and password (+ confirmation)
2. API validates email against Student whitelist
3. Checks: exists, active, not already registered
4. Creates User with name from Student entry
5. Links Student to User (sets userId)
6. Auto-login after successful registration

**Admin Student Management (`/admin/schueler`):**
- List all students with registration status, Steckbrief status
- Detail view with all student information
- Manual CRUD operations
- CSV import for bulk creation
- Activate/deactivate students

**API Endpoints:**
- `GET /api/admin/students` - List all students
- `POST /api/admin/students` - Create student
- `GET /api/admin/students/[studentId]` - Get student details
- `PATCH /api/admin/students/[studentId]` - Update student
- `POST /api/admin/students/import` - CSV import

**CSV Import Format:**
- Required columns: `Vorname`, `Nachname`
- Optional: `Email` (auto-generated if missing: vorname.nachname@lessing-ffm.net), `Geschlecht` (m/w)
- Supports `;` and `,` delimiters
- Skips duplicates, reports errors

**User Settings:**
- Students can only change their password
- Name and email are read-only (from whitelist)

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
- **DRAFT:** Student can edit freely, not yet submitted
- **SUBMITTED:** Marked as done, content goes to yearbook export
- **Auto-retract:** Editing after submit automatically resets to DRAFT
- **Explicit retract:** Students can also manually retract (SUBMITTED → DRAFT)

### 5. User Experience
- **ConfirmDialog:** All destructive actions (retract, remove image) use design-consistent dialogs
- **Unsaved changes warning:**
  - Browser-native dialogs for all navigation attempts (consistent UX)
  - Intercepts link clicks with `useUnsavedChangesWarning` hook
  - Tracks changes with `lastSavedState` (not just initial)
- **Visual feedback:** "Neu" label on unsaved images, removed after save without reload
- **Auto-sync:** State updates immediately after save, no manual refresh needed

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

## Ranking Feature (Implemented)

**Overview:**
Students vote on ranking questions, selecting one classmate or teacher per question. Gender-specific questions allow separate male/female votes. Results are anonymous and visible only to admins.

### 1. Core Concepts
- **Question types:** STUDENT (vote for classmate) or TEACHER (vote for teacher)
- **Gender-specific:** Questions can require separate male + female answers
- **Strict selection:** Autocomplete with validation, no free-text input
- **Multi-word search:** Query split into words, each matched independently (e.g. "Herr Mayer" finds "Mayer")
- **Candidate list:** Collapsible list of all eligible persons for inspiration

### 2. Teacher Management (`/admin/lehrer`)
- CRUD operations with soft-delete
- CSV import (columns: `Anrede`, `Nachname`, optional `Vorname`, `Fach`)
- Salutation determines gender for ranking filter (HERR → MALE, FRAU → FEMALE)

### 3. Question Management (`/admin/ranking-fragen`)
- CRUD with drag&drop reorder (desktop) + arrow buttons (mobile/tablet)
- CSV import (columns: `Text`, `Typ` (Schüler/Lehrer), `Geschlechtsspezifisch` (ja/nein))
- Fixed order for all students (admin-configurable)

### 4. Voting Workflow
- **DRAFT:** Student can vote/change freely, not yet submitted
- **SUBMITTED:** Marked as done, votes counted in statistics
- **Auto-retract:** Changing a vote after submit automatically resets to DRAFT
- **Explicit retract:** Students can also manually retract (SUBMITTED → DRAFT)
- Unique constraint: one vote per question per genderTarget per user

### 5. Admin Statistics (`/admin/rankings`)
- Participation overview (total, submitted, not submitted list)
- Per-question results (top 10 with vote count + percentage bars)
- Gender-specific results displayed in separate columns
- Only counts votes from submitted users

### 6. API Endpoints

**Student Rankings:**
- `GET /api/rankings` - Load questions, votes, submission, candidates
- `PATCH /api/rankings` - Save/update a vote
- `DELETE /api/rankings/vote/[questionId]` - Remove a vote
- `POST /api/rankings/submit` - Submit (DRAFT → SUBMITTED)
- `POST /api/rankings/retract` - Retract (SUBMITTED → DRAFT)
- `GET /api/rankings/search/students` - Autocomplete (with gender filter)
- `GET /api/rankings/search/teachers` - Autocomplete (with salutation-based filter)

**Admin:**
- `GET/POST /api/admin/teachers` - Teacher CRUD
- `PATCH/DELETE /api/admin/teachers/[id]` - Update/deactivate teacher
- `POST /api/admin/teachers/import` - Teacher CSV import
- `GET/POST /api/admin/ranking-questions` - Question CRUD
- `PATCH/DELETE /api/admin/ranking-questions/[id]` - Update/deactivate question
- `PATCH /api/admin/ranking-questions/reorder` - Bulk reorder
- `POST /api/admin/ranking-questions/import` - Question CSV import
- `GET /api/admin/rankings/stats/[questionId]` - Per-question results

## Zitate Feature (Implemented)

**Overview:**
Students can collect and submit quotes from teachers AND other students. Both types use the same UI pattern with tab navigation (Schüler | Lehrer). Each person has a detail page showing all quotes (anonymous) and the student's own quotes (deletable). Admins can view all quotes with submitter info, edit, and delete them.

### 1. Core Concepts
- **Tab navigation:** `/zitate/schueler` and `/zitate/lehrer` for students, same for admin
- **No submission workflow:** Students simply add quotes incrementally, no DRAFT/SUBMITTED status
- **Bulk entry:** Textarea with one quote per line (max 10 per submission, max 500 chars each)
- **Anonymous to students:** Students see all quotes but not who submitted them
- **Own quotes highlighted:** Student's own quotes shown in separate section with delete option
- **Admin attribution:** Admins see who submitted each quote
- **Self-exclusion:** Students cannot add quotes about themselves

### 2. Data Model
- `TeacherQuote`: id, text (VarChar 500), teacherId, userId, createdAt
- `StudentQuote`: id, text (VarChar 500), studentId, userId, createdAt
- Hard-delete (no soft-delete needed for quotes)
- Relations: Teacher/Student (many-to-one), User (many-to-one)

### 3. Student Pages
- **Schüler-List (`/zitate/schueler`):** All registered students (except self) with quote counts
- **Schüler-Detail (`/zitate/schueler/[studentId]`):** "Meine Zitate" + "Alle Zitate"
- **Lehrer-List (`/zitate/lehrer`):** All active teachers with quote counts
- **Lehrer-Detail (`/zitate/lehrer/[teacherId]`):** "Meine Zitate" + "Alle Zitate"

### 4. Admin Pages
- **Schüler-List (`/admin/zitate/schueler`):** All registered students with quote counts
- **Schüler-Detail (`/admin/zitate/schueler/[studentId]`):** All quotes with submitter name
- **Lehrer-List (`/admin/zitate/lehrer`):** All active teachers with quote counts
- **Lehrer-Detail (`/admin/zitate/lehrer/[teacherId]`):** All quotes with submitter name

### 5. API Endpoints

**Student - Teacher Quotes:**
- `GET /api/teacher-quotes` - List active teachers with quote counts
- `GET /api/teacher-quotes/[teacherId]` - Teacher info + quotes (with isOwn flag)
- `POST /api/teacher-quotes/[teacherId]` - Bulk create quotes (array of strings)
- `DELETE /api/teacher-quotes/quote/[quoteId]` - Delete own quote

**Student - Student Quotes:**
- `GET /api/student-quotes` - List registered students (excluding self) with quote counts
- `GET /api/student-quotes/[studentId]` - Student info + quotes (with isOwn flag)
- `POST /api/student-quotes/[studentId]` - Bulk create quotes (array of strings)
- `DELETE /api/student-quotes/quote/[quoteId]` - Delete own quote

**Admin - Teacher Quotes:**
- `GET /api/admin/teacher-quotes` - List active teachers with quote counts
- `GET /api/admin/teacher-quotes/[teacherId]` - Quotes with user attribution
- `PATCH /api/admin/teacher-quotes/quote/[quoteId]` - Edit quote text
- `DELETE /api/admin/teacher-quotes/quote/[quoteId]` - Delete any quote

**Admin - Student Quotes:**
- `GET /api/admin/student-quotes` - List registered students with quote counts
- `GET /api/admin/student-quotes/[studentId]` - Quotes with user attribution
- `PATCH /api/admin/student-quotes/quote/[quoteId]` - Edit quote text
- `DELETE /api/admin/student-quotes/quote/[quoteId]` - Delete any quote

### 6. Components
- `TeacherQuoteList` - Teacher list component (student + admin, basePath prop)
- `StudentQuoteList` - Student list component (student + admin, basePath prop)
- `TeacherQuoteDetail` - Student detail for teacher quotes
- `StudentQuoteDetail` - Student detail for student quotes
- `QuoteInput` - Shared textarea with line-based parsing and validation
- `TeacherQuoteAdminDetail` - Admin detail for teacher quotes
- `StudentQuoteAdminDetail` - Admin detail for student quotes

## Umfragen Feature (Implemented)

**Overview:**
Anonymous multiple-choice surveys for the yearbook. Admins create questions with 2-10 answer options, students select one answer per question. Answers are saved immediately (no submit workflow). Results are fully anonymous - even admins only see aggregate statistics.

### 1. Core Concepts
- **No submission workflow:** Answers are saved immediately on click
- **Anonymous:** userId stored for duplicate prevention but never exposed in stats
- **2-10 options per question:** Admin-defined answer choices
- **Fixed order:** Both questions and options have admin-defined order
- **Soft-delete:** Questions can be deactivated (data preserved)

### 2. Data Model
- `SurveyQuestion`: id, text, order, active
- `SurveyOption`: id, text, order, questionId (cascade-delete)
- `SurveyAnswer`: id, userId, questionId, optionId (unique: userId+questionId)

### 3. Student Page (`/umfragen`)
- Progress bar showing answered/total questions
- Info box about anonymity
- Radio button selection with immediate save
- Optimistic UI updates with error handling

### 4. Admin Pages
- **Management (`/admin/umfragen`):** CRUD for questions with dynamic option inputs, drag & drop reorder
- **Statistics (`/admin/umfragen-statistik`):** Participation overview, per-question results with bar charts

### 5. API Endpoints

**Student:**
- `GET /api/survey` - Active questions with options + user's answers
- `PATCH /api/survey/[questionId]` - Save/update answer (upsert)

**Admin:**
- `GET /api/admin/survey-questions` - All questions (including inactive)
- `POST /api/admin/survey-questions` - Create question with options
- `PATCH /api/admin/survey-questions/[id]` - Update question/options/active
- `PATCH /api/admin/survey-questions/reorder` - Bulk reorder questions
- `GET /api/admin/survey-questions/stats` - Aggregate statistics (anonymous)

### 6. Components
- `SurveyPage` - Main student page with progress and questions
- `SurveyQuestionCard` - Single question with radio buttons
- `SurveyManagement` - Admin CRUD orchestration
- `SurveyForm` - Form with dynamic option inputs (add/remove/reorder)
- `SurveyList` - Draggable question list
- `SurveyStats` - Statistics display with bar charts

## Kommentare Feature (Implemented)

**Overview:**
Students can write comments about other students AND teachers for the yearbook. Comments are anonymous to recipients (surprise for yearbook) but visible to admins for moderation.

### 1. Core Concepts
- **Target types:** Can comment on students OR teachers
- **One per target:** Max one comment per target per student (unique constraint)
- **No self-comments:** Students cannot comment on themselves
- **Anonymous to recipients:** Students cannot see comments about themselves
- **Own comments visible:** Students can see, edit, and delete their own written comments
- **Admin moderation:** Admins see all comments with author info, can edit/delete
- **No submission workflow:** Comments are saved immediately

### 2. Data Model
- `Comment`: id, text (VarChar 500), authorId, targetStudentId (nullable), targetTeacherId (nullable)
- Unique constraints: `[authorId, targetStudentId]` and `[authorId, targetTeacherId]`
- Hard-delete (no soft-delete needed for comments)
- Relations: User (author), Student (target), Teacher (target)

### 3. Student Page (`/kommentare`)
- "Neuen Kommentar schreiben" button opens form
- Target type selection (Mitschüler/in or Lehrer/in)
- PersonAutocomplete for target selection (excludes self)
- List of own written comments with edit/delete

### 4. Admin Page (`/admin/kommentare`)
- Statistics overview (total, by target type)
- Search and filter (by target type)
- All comments with author name displayed
- Inline edit and delete for any comment

### 5. API Endpoints

**Student:**
- `GET /api/comments` - List own written comments
- `POST /api/comments` - Create comment (with self-check and duplicate prevention)
- `PATCH /api/comments/[commentId]` - Edit own comment
- `DELETE /api/comments/[commentId]` - Delete own comment

**Admin:**
- `GET /api/admin/comments` - List all comments with author info
- `PATCH /api/admin/comments/[commentId]` - Edit any comment
- `DELETE /api/admin/comments/[commentId]` - Delete any comment

### 6. Components
- `CommentPage` - Main student page with add form and comment list
- `CommentForm` - Target type selector, PersonAutocomplete, textarea
- `CommentList` - List of own comments with edit/delete
- `CommentAdminPage` - Admin view with filters, inline edit/delete

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

### Soft Delete Pattern
- Never delete users from database
- Set `active: false` instead
- Middleware and auth checks verify `active` status
- Inactive users cannot log in

# Serena
When the Serena-mcp is available, it should always be used to its full extent.
If you are unsure about how to use it or if it is the beginning of a conversation, use the "initial_instructions" tool to get a better picture.
