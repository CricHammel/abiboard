# AbiBoard

Abibuch-Verwaltung für eure Abschlussklasse.

## Features

- **Steckbrief-Editor** - Schüler erstellen ihre Jahrbuch-Profile mit Texten und Bildern
- **Freigabe-Workflow** - Admins prüfen und genehmigen eingereichte Steckbriefe
- **Benutzerverwaltung** - Admins können Benutzer anlegen und verwalten
- **Dynamische Felder** - Admins können Steckbrief-Felder konfigurieren

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **PostgreSQL** + Prisma
- **NextAuth** (Credentials)
- **Tailwind CSS**

## Installation

```bash
# Dependencies installieren
npm install

# Datenbank erstellen (PostgreSQL)
createdb abiboard

# .env.example nach .env kopieren und anpassen
cp .env.example .env

# Datenbank-Migration ausführen
npx prisma migrate dev

# Entwicklungsserver starten
npm run dev
```

## Umgebungsvariablen

```bash
DATABASE_URL="postgresql://user@localhost:5432/abiboard"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Scripts

```bash
npm run dev      # Entwicklungsserver
npm run build    # Produktion build
npm start        # Produktion server
npx prisma studio # Datenbank-GUI
```

## Projektstruktur

```
app/
├── (auth)/        # Login, Register
├── (student)/     # Schüler-Bereich
└── admin/         # Admin-Bereich

components/
├── ui/            # Basis-Komponenten
├── auth/          # Auth-Komponenten
├── steckbrief/    # Steckbrief-Komponenten
└── admin/         # Admin-Komponenten

lib/               # Utilities (Auth, Prisma, Validation)
prisma/            # Schema & Migrations
```

## Lizenz

Privates Projekt - nur für interne Nutzung.
