# AbiBoard

Abibuch-Verwaltung (Yearbook Management) für die Abschlussklasse. Schüler erstellen ihre Jahrbuch-Inhalte, Admins (Abi-Komitee) verwalten den Prozess und exportieren die Daten für den Druck.

## Features

- **Steckbrief** — Profil-Editor mit Texten und Bildern, dynamische Felder (admin-konfigurierbar), Entwurf/Einreichen-Workflow
- **Rankings** — Abstimmungen zu Schüler- und Lehrer-Fragen, geschlechtsspezifische Optionen, Autovervollständigung
- **Zitate** — Zitate über Lehrer und Mitschüler sammeln, anonyme Anzeige, Bulk-Eingabe
- **Umfragen** — Anonyme Multiple-Choice-Umfragen, sofortige Speicherung
- **Kommentare** — Persönliche Kommentare über Mitschüler und Lehrer fürs Abibuch
- **Fotos** — Foto-Upload in admin-konfigurierbare Rubriken, Cover-Auswahl, Galerie-Browser
- **Datenexport** — TSV-Downloads und Bilder-ZIP für den Abibuch-Druck
- **Globale Deadline** — Admin-konfigurierbare Abgabefrist, nach Ablauf keine Bearbeitung mehr
- **Benutzerverwaltung** — Whitelist-basierte Registrierung (nur Schul-E-Mails), CSV-Import, Rollen (Schüler/Admin)

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- PostgreSQL + [Prisma](https://www.prisma.io/)
- [NextAuth v5](https://authjs.dev/) (Credentials)
- Tailwind CSS

## Voraussetzungen

- Node.js 18+
- PostgreSQL

## Installation

```bash
# Dependencies installieren
npm install

# .env.example nach .env kopieren und anpassen
cp .env.example .env

# Datenbank-Migration ausführen
npx prisma migrate dev

# (Optional) Testdaten einspielen
npx prisma db seed

# Entwicklungsserver starten
npm run dev
```

Die App läuft dann unter `http://localhost:3000`.

## Umgebungsvariablen

Siehe `.env.example` für alle Variablen:

| Variable | Beschreibung |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring |
| `NEXTAUTH_SECRET` | Secret Key (generieren mit `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App-URL (z.B. `http://localhost:3000`) |

## Scripts

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktion-Build |
| `npm start` | Produktion-Server |
| `npm run lint` | ESLint |
| `npx prisma studio` | Datenbank-GUI |
| `npx prisma migrate dev` | Migration erstellen/anwenden |
| `npx prisma db seed` | Testdaten einspielen |

## Projektstruktur

```
app/
├── (auth)/              # Login, Registrierung
├── (student)/           # Schüler-Bereich (Steckbrief, Rankings, Zitate, Umfragen, Kommentare)
├── admin/               # Admin-Bereich (Verwaltung, Statistiken, Export)
└── api/                 # API-Routen

components/
├── ui/                  # Basis-Komponenten (Button, Card, Input, Alert, Badge, etc.)
├── steckbrief/          # Steckbrief-Editor
├── rankings/            # Rankings-Abstimmung
├── teacher-quotes/      # Lehrer-Zitate
├── student-quotes/      # Schüler-Zitate
├── survey/              # Umfragen
├── comments/            # Kommentare
├── photos/              # Foto-Upload & Galerie
├── admin/               # Admin-Komponenten
└── navigation/          # Navigation, Deadline-Anzeige

lib/                     # Utilities (Auth, Prisma, Validation, File Upload, Export)
prisma/                  # Datenbankschema & Migrationen
```

## Benutzerrollen

**Schüler** registrieren sich mit ihrer Schul-E-Mail (Whitelist-basiert). Sie können ihre eigenen Inhalte bearbeiten und einreichen.

**Admins** werden über die Datenbank angelegt (`npx prisma db seed`). Sie haben vollen Zugriff auf alle Inhalte, Statistiken und Exportfunktionen.

## Lizenz

Privates Projekt — nur für interne Nutzung.
