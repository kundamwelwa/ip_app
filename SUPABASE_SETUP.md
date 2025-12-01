# Supabase + Vercel Setup Guide

Complete guide for connecting your Supabase PostgreSQL database to your Vercel deployment.

## 📋 Step 1: Get Your Supabase Connection String

### Option A: Connection Pooling (Recommended for Serverless)

1. Go to your Supabase project dashboard: [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection Pooling**
5. Copy the **Connection Pooling** connection string (starts with `postgresql://`)
   - It will look like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - **Port 6543** = Connection Pooling (use this for Vercel)
   - **Port 5432** = Direct connection (not recommended for serverless)

### Option B: Direct Connection (If pooling not available)

1. Go to **Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Copy the connection string
4. **Important:** Add `?sslmode=require` at the end if not present

**Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

---

## 📋 Step 2: Set Up Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create new project if not done yet)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

### Required Variables:

#### 1. DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** Your Supabase connection string (from Step 1)
- **Environment:** Select all (Production, Preview, Development)

**Example (Connection Pooling):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Example (Direct Connection):**
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

#### 2. NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Generate a secure random string

**Generate on Linux/Mac:**
```bash
openssl rand -base64 32
```

**Generate on Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use online generator:** [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

- **Environment:** Select all (Production, Preview, Development)

#### 3. NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** Your Vercel deployment URL

**For Production:**
```
https://your-app.vercel.app
```

**For Preview/Development:**
```
http://localhost:3000
```

- **Environment:** 
  - Production: `https://your-app.vercel.app`
  - Preview: `https://your-app-git-[branch].vercel.app` (or use preview URL)
  - Development: `http://localhost:3000`

---

## 📋 Step 3: Deploy to Vercel

### If you haven't deployed yet:

1. **Push your code to Git:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect Next.js
   - **Don't deploy yet** - we need to set environment variables first

3. **Set Environment Variables** (from Step 2 above)

4. **Deploy:**
   - Click **Deploy** button
   - Wait for build to complete

### If already deployed:

1. **Add Environment Variables** (from Step 2)
2. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Redeploy** on latest deployment
   - Or push a new commit to trigger redeploy

---

## 📋 Step 4: Run Database Migrations

After your first successful deployment, you need to run Prisma migrations to set up your database schema.

### Option A: Via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Pull environment variables:**
   ```bash
   vercel env pull .env.production
   ```
   This creates a `.env.production` file with your environment variables.

4. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Verify migration:**
   ```bash
   npx prisma studio
   ```
   This opens Prisma Studio where you can see your database tables.

### Option B: Via Supabase SQL Editor (Alternative)

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy the SQL from your migration files:
   - Located in `prisma/migrations/[migration-name]/migration.sql`
3. Paste and run in SQL Editor
4. Repeat for all migration files

### Option C: Create Temporary Migration API Route

⚠️ **Only for first-time setup. Delete after use!**

1. Create `app/api/migrate/route.ts`:
   ```typescript
   import { NextResponse } from "next/server";
   import { exec } from "child_process";
   import { promisify } from "util";

   const execAsync = promisify(exec);

   export async function POST(request: Request) {
     // Add a simple password check for security
     const { password } = await request.json();
     if (password !== process.env.MIGRATION_PASSWORD) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     try {
       const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
       return NextResponse.json({ 
         success: true, 
         output: stdout,
         error: stderr 
       });
     } catch (error: any) {
       return NextResponse.json(
         { error: error.message, output: error.stdout, stderr: error.stderr },
         { status: 500 }
       );
     }
   }
   ```

2. Add `MIGRATION_PASSWORD` to Vercel environment variables (temporary)
3. Deploy
4. Call the endpoint:
   ```bash
   curl -X POST https://your-app.vercel.app/api/migrate \
     -H "Content-Type: application/json" \
     -d '{"password":"your-migration-password"}'
   ```
5. **Delete the route and environment variable after migration!**

---

## 📋 Step 5: Seed Database (Optional)

If you have seed data in `prisma/seed.ts`:

```bash
# Pull environment variables first
vercel env pull .env.production

# Run seed
npx prisma db seed
```

---

## 📋 Step 6: Verify Deployment

1. **Visit your deployment:**
   - Go to `https://your-app.vercel.app`
   - Should see your application homepage

2. **Test Login:**
   - Go to `/login`
   - If you have a test user, try logging in
   - If not, you'll need to create a user first (via registration or seed)

3. **Test Database Connection:**
   - Try creating a test equipment entry
   - Try adding an IP address
   - Check if data persists (refresh page)

4. **Check Vercel Logs:**
   - Go to Vercel Dashboard → **Deployments** → Click on deployment
   - Check **Function Logs** for any errors
   - Check **Build Logs** for build issues

---

## 🔧 Supabase-Specific Configuration

### Connection Pooling Settings

Supabase connection pooling is **essential** for Vercel serverless functions because:
- Serverless functions create new connections frequently
- Connection pooling reuses connections efficiently
- Prevents "too many connections" errors

**Use Port 6543** (Connection Pooler) instead of 5432 (Direct)

### SSL Mode

Always include `?sslmode=require` in your connection string for security.

### Connection String Format

**Connection Pooling (Recommended):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Direct Connection:**
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

---

## 🐛 Troubleshooting

### "Too many connections" Error

**Solution:** Use connection pooling (port 6543) instead of direct connection (port 5432)

### "Connection timeout" Error

**Solution:**
- Check if your Supabase project is paused (free tier pauses after inactivity)
- Verify connection string is correct
- Check Supabase dashboard for service status

### "SSL required" Error

**Solution:** Add `?sslmode=require` to your connection string

### Migration Fails

**Solution:**
- Verify `DATABASE_URL` is correct in `.env.production`
- Check Supabase SQL Editor to see if tables already exist
- Try running migrations one by one

### Authentication Not Working

**Solution:**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL exactly
- Clear browser cookies and try again

---

## ✅ Success Checklist

- [ ] Supabase database created
- [ ] Connection string copied (using port 6543 for pooling)
- [ ] Environment variables set in Vercel:
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
- [ ] Code deployed to Vercel
- [ ] Database migrations run successfully
- [ ] Homepage loads correctly
- [ ] Login page accessible
- [ ] Can create test data (equipment/IP)
- [ ] Data persists after page refresh

---

## 📞 Next Steps

1. **Set up custom domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Update `NEXTAUTH_URL` to match custom domain

2. **Configure backups** (if needed):
   - Supabase Dashboard → Settings → Database → Backups

3. **Monitor usage:**
   - Check Supabase Dashboard for database usage
   - Monitor Vercel function logs for errors

---

**You're all set!** Your Supabase database is now connected to Vercel. 🎉

