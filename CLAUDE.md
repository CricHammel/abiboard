# CLAUDE.md

## Project Overview

**AbiBoard** — Abibuch (yearbook) management web app for a German high school graduating class. Students manage profiles, admins (Abi-Komitee) track progress. Internal app for one class only.

**Tech Stack:** Next.js (App Router), TypeScript, PostgreSQL, Prisma, NextAuth v5

## Conventions

### Language
- **Code:** English (variables, functions, types, comments)
- **UI text:** German (labels, buttons, errors, validation messages, API responses shown to users)

### Development
- Propose structure/approach BEFORE implementing, wait for approval
- No over-engineering — implement only what's requested
- UI must follow design system in `DESIGN.md` (mobile-first, 44px touch targets, WCAG AA)
- Always use `npm run build` and `npx eslint` to verify the code works (you can shorten/filter the output if it eats up too much context)

### Git
- Commit after each meaningful change, descriptive messages in English
- Never use `cd` — you can be sure that you always work from root directory (if not, use `pwd` to see your current directory)
- Use `git reset HEAD~1` for soft undo, `git reset --hard HEAD~1` for hard undo
- Always verify with `git log` before resetting

## Architecture

### Roles
- **STUDENT:** Edit own profile, vote, submit quotes/comments/surveys
- **ADMIN:** Full access, manage all content, view statistics, export data

### Key Patterns
- **DRAFT → SUBMITTED workflow:** Used by Steckbrief and Rankings. Auto-retract on edit after submit.
- **Soft delete:** Users, Students, Teachers, Fields, Questions use `active: false` (never hard-delete). Inactive users can't log in.
- **Global deadline:** Admin-configurable cutoff in `AppSettings`. After deadline, all student write endpoints return 403. Check via `lib/deadline.ts` → `isDeadlinePassed()`.
- **File uploads:** `uploads/profiles/{userId}/` (outside `public/`, served via API route + rewrite), max 5MB, JPG/PNG/WebP only. Utils in `lib/file-upload.ts`.
- **Dynamic fields:** Steckbrief fields are admin-configurable at runtime (SteckbriefField table). Zod schemas generated dynamically.
- **Whitelist registration:** Students register with @lessing-ffm.net email, validated against Student table.

### Features
Steckbrief (profile), Rankings (voting), Zitate (quotes for teachers & students), Umfragen (anonymous surveys), Kommentare (comments about others), Fotos (photo upload by category), Data Export (TSV + ZIP), Global Deadline.

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npx prisma migrate dev --name <name>  # Create migration
npx prisma generate      # Regenerate client
npx prisma studio        # DB GUI
npx prisma db seed       # Seed data
npx eslint .             # Run ESLint
```

## Project Structure

```
app/
├── (auth)/              # Login, Register
├── (student)/           # Student pages (dashboard, steckbrief, rankings, zitate, umfragen, kommentare, einstellungen)
├── admin/               # Admin pages (dashboard, steckbrief, rankings, umfragen, zitate, kommentare, fotos, export, verwaltung, einstellungen)
└── api/                 # API routes (auth, steckbrief, rankings, survey, quotes, comments, admin/*, register)

components/
├── ui/                  # Base components (Button, Card, Input, Alert, Badge, TabNav, ProgressBar, StatsGrid, ParticipationSection, ConfirmDialog, etc.)
├── steckbrief/          # SteckbriefForm, FieldRenderer, image uploads
├── rankings/            # RankingsPage, QuestionCard, PersonAutocomplete
├── teacher-quotes/      # TeacherQuoteList, TeacherQuoteDetail, QuoteInput
├── student-quotes/      # StudentQuoteList, StudentQuoteDetail
├── survey/              # SurveyPage, SurveyQuestionCard
├── comments/            # CommentPage, CommentForm, CommentList
├── admin/               # Admin-specific components per feature + shared CsvImportPage/CsvImportPreview
├── navigation/          # StudentNav, AdminNav, DeadlineIndicator
└── auth/, settings/, dashboard/, providers/

lib/                     # prisma.ts, auth.ts, validation.ts, file-upload.ts, deadline.ts, tsv-export.ts, csv-parse.ts, steckbrief-validation-dynamic.ts
prisma/                  # schema.prisma, seed.ts, migrations/
```

## Important Notes

### Next.js 15+ Dynamic Routes
Route params are Promises — must be awaited:
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

### Database Schema
All models are defined in `prisma/schema.prisma`. Key models: User, Student, Profile, SteckbriefField, SteckbriefValue, Teacher, RankingQuestion, RankingVote, RankingSubmission, TeacherQuote, StudentQuote, SurveyQuestion, SurveyOption, SurveyAnswer, Comment, AppSettings.

# Serena
When the Serena-mcp is available, it should always be used to its full extent.
If you are unsure about how to use it or if it is the beginning of a conversation, use the "initial_instructions" tool to get a better picture.
