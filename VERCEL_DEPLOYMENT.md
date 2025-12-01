# Vercel Deployment Guide

Complete guide for deploying the IP Address Management System to Vercel.

## 📋 Pre-Deployment Checklist

### 1. Code Review
- ✅ All environment variables are properly configured
- ✅ No hardcoded secrets or credentials
- ✅ Database migrations are up to date
- ✅ Build script works locally (`npm run build`)

### 2. Database Setup
- ✅ PostgreSQL database provisioned (Vercel Postgres, Supabase, or external)
- ✅ Database URL ready for production
- ✅ Connection pooling configured (if needed)

### 3. Environment Variables
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Secure random string for NextAuth
- ✅ `NEXTAUTH_URL` - Production URL (e.g., `https://your-app.vercel.app`)

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Ensure all changes are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify `.gitignore` includes:**
   - `.env*` files
   - `node_modules/`
   - `.next/`
   - `.vercel/`

### Step 2: Set Up Vercel Postgres (Recommended)

**Option A: Vercel Postgres (Easiest)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project → Storage → Create Database
3. Select **Postgres**
4. Choose a plan and region
5. Copy the `POSTGRES_URL` connection string

**Option B: External Database (Supabase, Railway, etc.)**
- Use your existing PostgreSQL connection string
- Ensure it supports SSL connections
- Format: `postgresql://user:password@host:port/database?sslmode=require`

### Step 3: Create Vercel Project

1. **Via Vercel Dashboard:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select your repository and branch

2. **Via Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

### Step 4: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

#### Required Variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NEXTAUTH_SECRET=your-super-secret-random-string-here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Generate NEXTAUTH_SECRET:
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### Environment-Specific Settings:
- **Production:** Set all three variables
- **Preview:** Set `DATABASE_URL` and `NEXTAUTH_SECRET` (use preview URL for `NEXTAUTH_URL`)
- **Development:** Optional (for local testing)

### Step 5: Configure Build Settings

Vercel will auto-detect Next.js, but verify these settings:

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```bash
npm install
```

**Node Version:**
- Vercel auto-detects from `package.json` or `.nvmrc`
- Recommended: Node.js 18.x or 20.x

### Step 6: Add Prisma Build Step

Vercel needs to generate Prisma Client during build. Update `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**OR** create `vercel.json`:

```json
{
  "buildCommand": "prisma generate && npm run build",
  "installCommand": "npm install"
}
```

### Step 7: Deploy

1. **First Deployment:**
   - Push to your main branch
   - Vercel will automatically deploy
   - Or click "Deploy" in Vercel Dashboard

2. **Monitor Build Logs:**
   - Watch for Prisma Client generation
   - Check for any build errors
   - Verify environment variables are loaded

### Step 8: Run Database Migrations

After first deployment, run migrations:

**Option A: Via Vercel CLI (Recommended):**
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

**Option B: Via Vercel Dashboard:**
1. Go to your project → Settings → Functions
2. Use Vercel's built-in database migration tool
3. Or connect via SSH and run migrations

**Option C: Create Migration API Route (Temporary):**
Create `app/api/migrate/route.ts` (remove after migration):
```typescript
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { exec } = await import("child_process");
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
    return NextResponse.json({ success: true, output: stdout });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

⚠️ **Remove this route after migration for security!**

### Step 9: Seed Database (Optional)

If you have seed data:
```bash
vercel env pull .env.production
npx prisma db seed
```

---

## 🔧 Post-Deployment Configuration

### 1. Verify Environment Variables
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure all variables are set for Production environment

### 2. Test Authentication
- Visit `https://your-app.vercel.app/login`
- Test login functionality
- Verify session persistence

### 3. Test Database Connection
- Create a test equipment entry
- Verify IP address assignment
- Check audit logs are being created

### 4. Configure Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to match your domain
4. Follow DNS configuration instructions

---

## 🐛 Troubleshooting

### Build Fails: "Prisma Client not generated"
**Solution:**
- Add `prisma generate` to build command
- Or add `postinstall` script in `package.json`

### Database Connection Errors
**Solution:**
- Verify `DATABASE_URL` format
- Check SSL mode: `?sslmode=require`
- Ensure database allows connections from Vercel IPs
- Check connection pool limits

### Authentication Not Working
**Solution:**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- Clear browser cookies and try again

### Environment Variables Not Loading
**Solution:**
- Ensure variables are set for correct environment (Production/Preview)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Function Timeout Errors
**Solution:**
- Vercel Hobby plan: 10s timeout
- Vercel Pro plan: 60s timeout
- Optimize slow API routes
- Consider using Edge Functions for faster responses

---

## 📊 Monitoring & Maintenance

### 1. Enable Vercel Analytics
- Go to Project Settings → Analytics
- Enable Web Analytics
- Monitor performance metrics

### 2. Set Up Error Tracking
- Consider integrating Sentry or similar
- Monitor API route errors
- Track user-reported issues

### 3. Database Backups
- Configure automatic backups (Vercel Postgres includes this)
- Or set up manual backup schedule for external databases

### 4. Performance Optimization
- Enable Vercel Edge Caching
- Optimize images (Next.js Image component)
- Monitor API response times

---

## 🔐 Security Checklist

- ✅ Environment variables are not committed to Git
- ✅ `NEXTAUTH_SECRET` is strong and unique
- ✅ Database connection uses SSL
- ✅ API routes are protected with authentication
- ✅ CORS is properly configured (if needed)
- ✅ Rate limiting is implemented (consider Vercel's built-in rate limiting)

---

## 📝 Additional Notes

### Prisma on Vercel
- Prisma Client is generated during build
- Migrations should be run manually or via CI/CD
- Connection pooling is handled automatically by Vercel Postgres

### Next.js 15 on Vercel
- Fully supported
- App Router works out of the box
- Server Components are optimized automatically

### File Uploads
- Excel file parsing happens client-side (no server storage needed)
- No file system writes required
- All processing is in-memory

---

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Homepage loads correctly
- ✅ Login page is accessible
- ✅ Database queries work
- ✅ Equipment/IP management functions properly
- ✅ No console errors in browser

---

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Review Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
3. Check Prisma deployment guide: [pris.ly/d/deployment](https://www.prisma.io/docs/guides/deployment)
4. Review Next.js deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

**Last Updated:** 2025-01-XX
**Next.js Version:** 15.5.4
**Prisma Version:** 6.16.2

