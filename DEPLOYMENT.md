# Deployment Guide: Vercel & Prisma

This guide provides step-by-step instructions for deploying the Verity Systems DMS to [Vercel](https://vercel.com).

## 📋 Prerequisites
1.  **Database**: You need a hosted PostgreSQL database.
    -   *Options*: Vercel Postgres, Supabase, Neon, or AWS RDS.
    -   **Important**: Ensure your database is accessible from Vercel's IP ranges or has "Allow all IPs" enabled during setup.

## 🚀 Deployment Steps

### 1. Database Connection
Extract your connection string. It should look like:
`postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`

### 2. Vercel Configuration
1.  **Import Project**: Push your code to GitHub/GitLab and import it into Vercel.
2.  **Environment Variables**: In the Vercel dashboard, go to **Settings > Environment Variables** and add:
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | Prisma connection string | `postgresql://...` |
    | `JWT_SECRET` | Secret for token signing | *(Any long random string)* |
    | `NEXT_PUBLIC_APP_URL` | Your production URL | `https://your-app.vercel.app` |
    | `NODE_ENV` | Environment mode | `production` |

### 3. Build Settings
Ensure these default settings are detected:
- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `next build`
- **Install Command**: `npm install` (The `postinstall` script will automatically run `prisma generate`).

### 4. Database Schema Sync
After the first successful build, you must sync your schema to the production database:
```bash
# From your local machine (with the production DATABASE_URL in .env.local)
npx prisma db push
node prisma/seed.js # Optional: Initial admin user setup
```

---

## 💻 Vercel CLI Deployment (Alternative)
If you prefer deploying from your terminal:

1.  **Install Vercel CLI**:
    ```bash
    npm i -g vercel
    ```
2.  **Login**:
    ```bash
    vercel login
    ```
3.  **Link Project**:
    ```bash
    vercel link
    ```
4.  **Add Environment Variables**:
    ```bash
    vercel env add DATABASE_URL
    vercel env add JWT_SECRET
    vercel env add NEXT_PUBLIC_APP_URL
    ```
5.  **Deploy**:
    ```bash
    # Preview deployment
    vercel

    # Production deployment
    vercel --prod
    ```

## ⚠️ Common Issues
- **Prisma Client Sync**: If you get a "Prisma Client not found" error, ensure `prisma generate` is in your `postinstall` script in `package.json`.
- **Database Timeouts**: Ensure your database provider supports enough concurrent connections for Vercel's serverless functions.
- **CORS/Redirection**: Ensure `NEXT_PUBLIC_APP_URL` matches your actual Vercel domain to avoid redirect issues.

## 🔍 Post-Deployment Check
1.  Visit `https://your-app.vercel.app/api/docs`.
2.  Try logging in with the seeded admin account.
3.  Check Vercel **Function Logs** if you encounter any `500` errors.
