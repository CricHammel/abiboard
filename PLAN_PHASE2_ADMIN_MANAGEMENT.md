# Admin Management Implementation Plan - Phase 2

**Status:** Geplant, noch nicht implementiert
**Geschätzte Zeit:** 4-5 Stunden
**Datum:** 2026-01-12

---

## Überblick

Implementierung von Admin-Management Features:
1. **Benutzerverwaltung** (`/admin/benutzer`) - User Management für Admins
2. **Einstellungen** (`/einstellungen` + `/admin/einstellungen`) - Settings für alle Rollen

## Design-Entscheidungen

### Passwort-Management
- ❌ Admins können NICHT fremde Passwörter ändern (Security Best Practice)
- ✅ Jeder User kann nur sein eigenes Passwort ändern

### User Deletion
- ✅ **SOFT DELETE** via neues `active` Feld in User Model
- Inaktive User können sich nicht einloggen
- Daten bleiben erhalten (Referential Integrity für Profile, etc.)

### Email-Änderungen
- ✅ Erlaubt mit Uniqueness-Validierung
- Deutsche Fehlermeldung bei Duplikat

### Bestätigungs-Dialoge
- ✅ Für User deaktivieren
- ✅ Für Rollen-Änderungen (ADMIN → STUDENT entfernt Zugriff)
- ✅ Passwort-Änderung mit aktuellem Passwort verifizieren

---

## Datenbank-Änderungen

### Migration: User Model erweitern

**Datei:** `prisma/schema.prisma`

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      Role     @default(STUDENT)
  active    Boolean  @default(true)  // NEU - für Soft Delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  profile Profile?

  @@map("users")
}
```

**Migration ausführen:**
```bash
npx prisma migrate dev --name add_user_active_field
npx prisma generate
```

---

## Dateistruktur

### Neue Dateien zu erstellen

```
app/
├── admin/
│   ├── benutzer/
│   │   ├── page.tsx                    # User-Liste (Server Component)
│   │   └── [userId]/
│   │       └── page.tsx                # User bearbeiten (Server Component)
│   └── einstellungen/
│       └── page.tsx                    # Admin Settings (Server Component)
├── einstellungen/
│   └── page.tsx                        # Student Settings (Server Component)
└── api/
    ├── admin/
    │   └── users/
    │       ├── route.ts                # POST - User erstellen
    │       └── [userId]/
    │           └── route.ts            # PATCH - User updaten/deaktivieren
    └── settings/
        ├── profile/
        │   └── route.ts                # PATCH - Eigene Daten ändern
        └── password/
            └── route.ts                # PATCH - Passwort ändern

components/
├── admin/
│   ├── UserList.tsx                    # Client: User-Tabelle mit Suche/Filter
│   ├── UserForm.tsx                    # Client: User erstellen/bearbeiten
│   └── ConfirmDialog.tsx               # Client: Bestätigungs-Modal
└── settings/
    ├── ProfileSettingsForm.tsx         # Client: Profil-Daten ändern
    └── PasswordChangeForm.tsx          # Client: Passwort ändern
```

### Zu modifizierende Dateien

```
lib/validation.ts                       # Neue Zod Schemas hinzufügen
middleware.ts                           # /einstellungen zu protected routes
```

---

## API Routes Design

### 1. POST `/api/admin/users` - User erstellen

**Request Body:**
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "ADMIN";
}
```

**Response (201):**
```json
{
  "message": "Benutzer erfolgreich erstellt.",
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "role": "STUDENT",
    "active": true
  }
}
```

**Logic:**
1. Session prüfen → Admin-Rolle erforderlich
2. Zod-Validierung
3. Email-Uniqueness prüfen
4. Passwort mit bcrypt hashen (10 rounds)
5. User erstellen (mit leerem Profile wenn STUDENT)
6. Success Response (Passwort ausschließen!)

---

### 2. PATCH `/api/admin/users/[userId]` - User updaten

**Request Body (alle Felder optional):**
```typescript
{
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "STUDENT" | "ADMIN";
  active?: boolean;
}
```

**Response (200):**
```json
{
  "message": "Benutzer erfolgreich aktualisiert.",
  "user": { ... }
}
```

**Logic:**
1. Session → Admin erforderlich
2. userId aus URL params extrahieren
3. Zod-Validierung (mindestens 1 Feld)
4. Wenn Email geändert → Uniqueness prüfen (aktuellen User ausschließen)
5. User updaten
6. Success Response

---

### 3. PATCH `/api/settings/profile` - Eigene Daten ändern

**Request Body:**
```typescript
{
  firstName?: string;
  lastName?: string;
  email?: string;
}
```

**Response (200):**
```json
{
  "message": "Profil erfolgreich aktualisiert.",
  "user": { ... }
}
```

**Logic:**
1. User-ID aus Session holen
2. Zod-Validierung
3. Email-Uniqueness bei Änderung prüfen
4. Eigene User-Daten updaten
5. Success Response

---

### 4. PATCH `/api/settings/password` - Passwort ändern

**Request Body:**
```typescript
{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

**Response (200):**
```json
{
  "message": "Passwort erfolgreich geändert."
}
```

**Logic:**
1. User-ID aus Session
2. Zod-Validierung (newPassword === confirmPassword)
3. User mit Passwort aus DB laden
4. currentPassword mit bcrypt.compare() verifizieren
5. newPassword hashen
6. Passwort in DB updaten
7. Success Response

**Fehler:**
- 401: "Das aktuelle Passwort ist falsch."

---

## Komponenten Design

### 1. UserList Component (Client)

**Datei:** `components/admin/UserList.tsx`

**Features:**
- **Suchleiste:** Name oder Email filtern (client-side)
- **Filter-Dropdowns:**
  - Rolle: Alle / Studenten / Admins
  - Status: Alle / Aktiv / Inaktiv
- **Tabelle (Desktop):**
  - Spalten: Name | Email | Rolle | Status | Profil-Status | Aktionen
  - Badge für Rolle (Blau: Student, Grau: Admin)
  - Badge für Status (Grün: Aktiv, Rot: Inaktiv)
  - Badge für Profil-Status (nur Students)
  - Aktionen: Bearbeiten-Button, Deaktivieren-Button
- **Cards (Mobile < 640px):**
  - Jeder User als Card
  - Alle Infos vertikal angeordnet

**Props:**
```typescript
interface UserListProps {
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    active: boolean;
    createdAt: Date;
    profile?: { status: ProfileStatus } | null;
  }>;
  onEdit: (userId: string) => void;
  onDeactivate: (userId: string, userName: string) => void;
}
```

---

### 2. UserForm Component (Client)

**Datei:** `components/admin/UserForm.tsx`

**Mode:** `create` oder `edit`

**Felder:**
- E-Mail (Input, type="email", required)
- Vorname (Input, required)
- Nachname (Input, required)
- Passwort (Input, type="password", nur bei create, required)
- Rolle (Select: Student / Admin, required)
- Benutzer ist aktiv (Checkbox, nur bei edit)

**Behavior:**
- Client-side Zod-Validierung
- POST zu `/api/admin/users` (create)
- PATCH zu `/api/admin/users/[id]` (edit)
- Loading Spinner während Submit
- Success: Callback `onSuccess()` aufrufen
- Error: ErrorMessage Component anzeigen

**Props:**
```typescript
interface UserFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    active: boolean;
  };
  onSuccess: () => void;
}
```

---

### 3. ConfirmDialog Component (Client)

**Datei:** `components/admin/ConfirmDialog.tsx`

**Reusable Modal für Bestätigungen**

**Design:**
- Semi-transparenter schwarzer Overlay
- Zentrierte weiße Card (max-width: 400px)
- Titel (bold, groß)
- Nachricht (grau, kleiner)
- Zwei Buttons: Abbrechen (secondary) / Bestätigen (danger für destructive)
- Loading State (Buttons disabled, Spinner)

**Accessibility:**
- Focus-Trap (nur innerhalb Modal)
- ESC-Taste schließt Modal
- Click außerhalb schließt Modal

**Props:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // Default: "Bestätigen"
  cancelText?: string;  // Default: "Abbrechen"
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

---

### 4. ProfileSettingsForm Component (Client)

**Datei:** `components/settings/ProfileSettingsForm.tsx`

**Formular für Profil-Daten**

**Felder:**
- Vorname (Input, prefilled)
- Nachname (Input, prefilled)
- E-Mail (Input, prefilled)

**Behavior:**
- PATCH zu `/api/settings/profile`
- Success: "Profil erfolgreich aktualisiert." + router.refresh()
- Error: ErrorMessage anzeigen

**Props:**
```typescript
interface ProfileSettingsFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
  };
}
```

---

### 5. PasswordChangeForm Component (Client)

**Datei:** `components/settings/PasswordChangeForm.tsx`

**Formular für Passwort-Änderung**

**Felder:**
- Aktuelles Passwort (Input, type="password")
- Neues Passwort (Input, type="password")
- Neues Passwort bestätigen (Input, type="password")

**Behavior:**
- Client-side Validierung (Passwörter gleich, min 8 Zeichen)
- PATCH zu `/api/settings/password`
- Success: "Passwort erfolgreich geändert." + Form clearen
- Error: "Das aktuelle Passwort ist falsch." oder Validierungsfehler

---

## Validierungs-Schemas (Zod)

**In `lib/validation.ts` hinzufügen:**

```typescript
import { z } from "zod";

// User Management Schemas
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib eine E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
  firstName: z.string().min(1, "Bitte gib einen Vornamen ein."),
  lastName: z.string().min(1, "Bitte gib einen Nachnamen ein."),
  role: z.enum(["STUDENT", "ADMIN"], {
    errorMap: () => ({ message: "Bitte wähle eine gültige Rolle." }),
  }),
});

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email("Bitte gib eine gültige E-Mail-Adresse ein.")
      .optional(),
    firstName: z.string().min(1, "Bitte gib einen Vornamen ein.").optional(),
    lastName: z.string().min(1, "Bitte gib einen Nachnamen ein.").optional(),
    role: z.enum(["STUDENT", "ADMIN"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Bitte gib mindestens ein Feld zum Aktualisieren an.",
  });

// Settings Schemas
export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, "Bitte gib deinen Vornamen ein.").optional(),
    lastName: z.string().min(1, "Bitte gib deinen Nachnamen ein.").optional(),
    email: z
      .string()
      .email("Bitte gib eine gültige E-Mail-Adresse ein.")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Bitte gib mindestens ein Feld zum Aktualisieren an.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Bitte gib dein aktuelles Passwort ein."),
    newPassword: z
      .string()
      .min(8, "Das neue Passwort muss mindestens 8 Zeichen lang sein."),
    confirmPassword: z
      .string()
      .min(1, "Bitte bestätige dein neues Passwort."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

// Export Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

---

## Sicherheits-Checklist

- ✅ Alle Admin-API-Routes: `session.user.role === "ADMIN"` am Anfang prüfen → 403 wenn nicht
- ✅ Settings-APIs: User-ID aus Session holen, niemals aus Request Body
- ✅ Passwörter: bcryptjs mit 10 rounds hashen, NIEMALS in API Responses zurückgeben
- ✅ Aktuelles Passwort verifizieren vor Änderung (bcrypt.compare)
- ✅ Email-Uniqueness immer auf Server prüfen
- ✅ Zod-Validierung auf Client UND Server
- ✅ Input sanitization: Trim whitespace, validate formats
- ✅ Session refresh nach Profil-Updates (router.refresh())

---

## Implementierungs-Reihenfolge

### Phase 2A: Datenbank & Validierung (30 min)
1. ✅ Prisma Schema updaten → `active Boolean @default(true)` zu User Model
2. ✅ Migration ausführen → `npx prisma migrate dev --name add_user_active_field`
3. ✅ Validation Schemas hinzufügen → Alle Schemas in `lib/validation.ts`
4. ✅ Prisma Client generieren → `npx prisma generate`

### Phase 2B: Settings API Routes (45 min)
5. ✅ `/api/settings/profile/route.ts` erstellen
6. ✅ `/api/settings/password/route.ts` erstellen
7. ✅ APIs testen (Postman/Thunder Client)

### Phase 2C: Settings UI Components (60 min)
8. ✅ `ProfileSettingsForm.tsx` erstellen
9. ✅ `PasswordChangeForm.tsx` erstellen
10. ✅ `/einstellungen/page.tsx` erstellen (Student)
11. ✅ `/admin/einstellungen/page.tsx` erstellen (Admin)
12. ✅ Middleware updaten → `/einstellungen` zu protected routes
13. ✅ Manuell testen (beide Rollen)

### Phase 2D: Admin User Management API (45 min)
14. ✅ `/api/admin/users/route.ts` erstellen (POST)
15. ✅ `/api/admin/users/[userId]/route.ts` erstellen (PATCH)
16. ✅ APIs testen (Auth, Validation, Error Handling)

### Phase 2E: Admin User Management UI (90 min)
17. ✅ `ConfirmDialog.tsx` erstellen (Reusable Modal)
18. ✅ `UserForm.tsx` erstellen (Create/Edit Form)
19. ✅ `UserList.tsx` erstellen (Table mit Search/Filter)
20. ✅ `/admin/benutzer/page.tsx` erstellen (User-Liste)
21. ✅ `/admin/benutzer/[userId]/page.tsx` erstellen (Edit Page)
22. ✅ User Management testen (Create, Edit, Deactivate)

### Phase 2F: Integration & Polish (30 min)
23. ✅ Admin Dashboard updaten (Links zu Einstellungen)
24. ✅ End-to-End Testing (alle Flows)
25. ✅ Mobile Testing (responsive)
26. ✅ Git Commit mit beschreibender Message

**Gesamtzeit:** ~4-5 Stunden

---

## Testing Checklist

### Benutzerverwaltung (Admin)
- [ ] Neuen Student erstellen → Erfolg
- [ ] Neuen Admin erstellen → Erfolg
- [ ] User mit existierender Email → Fehler "Diese E-Mail-Adresse wird bereits verwendet."
- [ ] User mit zu kurzem Passwort → Validierungsfehler
- [ ] User-Liste anzeigen → Alle User korrekt
- [ ] Suche nach Name → Funktioniert
- [ ] Filter nach Rolle → Zeigt nur gewählte Rolle
- [ ] Filter nach Status → Zeigt nur gewählten Status
- [ ] User bearbeiten (Name ändern) → Erfolg
- [ ] User bearbeiten (Email ändern zu existierender) → Fehler
- [ ] User bearbeiten (Rolle ändern STUDENT → ADMIN) → Confirmation → Erfolg
- [ ] User deaktivieren → Confirmation Modal → Erfolg
- [ ] Deaktivierter User kann sich nicht einloggen → Login-Fehler
- [ ] Mobile View → Cards statt Tabelle, Buttons erreichbar

### Einstellungen (Student & Admin)
- [ ] Student öffnet `/einstellungen` → Seite lädt
- [ ] Admin öffnet `/admin/einstellungen` → Seite lädt
- [ ] Vorname ändern → Erfolg, Session aktualisiert
- [ ] Email ändern zu existierender Email → Fehler
- [ ] Email ändern zu neuer Email → Erfolg
- [ ] Passwort ändern mit falschem aktuellem Passwort → Fehler "Das aktuelle Passwort ist falsch."
- [ ] Passwort ändern mit nicht übereinstimmenden neuen Passwörtern → Validierungsfehler
- [ ] Passwort erfolgreich ändern → Success Message, Login mit neuem Passwort funktioniert
- [ ] Mobile View → Forms korrekt dargestellt

### Security Tests
- [ ] Student greift auf `/admin/benutzer` zu → Redirect zu `/dashboard`
- [ ] Student sendet POST zu `/api/admin/users` → 403 Forbidden
- [ ] User versucht fremde Profil-Daten zu ändern via API → Fehlschlag
- [ ] Passwort nie in API Responses → Verifiziert (auch bei Errors)

### Edge Cases
- [ ] Admin bearbeitet eigenen Account → Funktioniert
- [ ] Admin ändert eigene Rolle zu STUDENT → Verliert Admin-Zugriff (intentional)
- [ ] Session abgelaufen während Form-Submit → Redirect zu Login
- [ ] Sehr lange Namen/Emails → UI truncated, Backend validiert
- [ ] Sonderzeichen in Namen → Korrekt behandelt

---

## Verwendung von Serena Tools

**Best Practices für diese Implementation:**

1. **find_symbol** vor jedem Edit verwenden:
   ```typescript
   mcp__serena__find_symbol(name_path_pattern="registerSchema", relative_path="lib/validation.ts")
   ```

2. **insert_after_symbol** für neue Exports:
   ```typescript
   mcp__serena__insert_after_symbol(
     name_path="registerSchema",
     relative_path="lib/validation.ts",
     body="export const createUserSchema = ..."
   )
   ```

3. **replace_symbol_body** für komplette Funktionen:
   ```typescript
   mcp__serena__replace_symbol_body(
     name_path="POST",
     relative_path="app/api/register/route.ts",
     body="async function POST(request: Request) { ... }"
   )
   ```

4. **Bestehende API Routes als Template**:
   - `/api/register/route.ts` für neue Admin-User-API
   - `LoginForm.tsx` für neue Form-Komponenten

---

## Notizen

- Plan erstellt: 2026-01-12
- Basis: Bestehende Auth-Implementierung (NextAuth v5, Prisma, Zod)
- Design System: DESIGN.md (Tailwind v3, Primary Blue, Mobile-first)
- Sprache: Code English, UI German
- Sicherheit: bcryptjs, JWT, Role-based Access Control

**Bei Fragen/Problemen:**
- Serena Memory: `project_overview.md`, `tech_stack.md`, `code_style_conventions.md`
- Bestehende Patterns: Auth-Code in `/lib/auth.ts`, Forms in `/components/auth/`
- Design Reference: `/DESIGN.md`
