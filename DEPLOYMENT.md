# Deployment Guide

## Local Development (Mac)

### Database Connection
- Uses Postgres.app with your Mac username
- No password required
- `.env` example:
```bash
DATABASE_URL="postgresql://your-mac-username@localhost:5432/abibuch"
NEXTAUTH_URL="http://localhost:3000"
```

### Setup Steps
1. Install Postgres.app
2. Create database: `createdb abibuch`
3. Copy `.env.example` to `.env` and adjust username
4. Run migration: `npx prisma migrate dev`
5. Start dev server: `npm run dev`

---

## Production (Raspberry Pi / Linux)

### Database Setup

**1. Install PostgreSQL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**2. Create database and user:**
```bash
# Switch to postgres user
sudo -u postgres psql

# In psql console:
CREATE DATABASE abibuch;
CREATE USER abibuch_user WITH PASSWORD 'secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE abibuch TO abibuch_user;
\q
```

**3. Configure `.env` on Raspberry Pi:**
```bash
DATABASE_URL="postgresql://abibuch_user:secure-password-here@localhost:5432/abibuch"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://your-raspberry-pi-ip:3000"
```

**4. Deploy application:**
```bash
# Clone repository
git clone <your-repo-url>
cd abibuch_tool

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start production server
npm start
```

### Security Notes
- Use strong passwords in production
- Generate a secure NEXTAUTH_SECRET: `openssl rand -base64 32`
- Consider using environment-specific `.env` files
- Never commit `.env` to Git
- Use HTTPS in production (consider using nginx as reverse proxy)

---

## Important Notes

**Environment Variables:**
- Each environment (Mac, Raspberry Pi) has its own `.env` file
- `.env` is in `.gitignore` and never committed
- Use `.env.example` as template
- Copy and adjust for each deployment

**Database Credentials:**
- **Mac**: Username without password (Postgres.app default)
- **Raspberry Pi**: Username with strong password (PostgreSQL standard)

**Git Workflow:**
1. Develop on Mac
2. Commit and push code (without `.env`)
3. Pull on Raspberry Pi
4. Create separate `.env` with production credentials
5. Deploy
