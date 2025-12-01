# Quick Deployment Checklist

Use this checklist before deploying to Vercel.

## ✅ Pre-Deployment

- [ ] All code is committed and pushed to Git
- [ ] Local build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] Database is provisioned (Vercel Postgres or external)
- [ ] Database migrations are ready

## 🔐 Environment Variables (Set in Vercel Dashboard)

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Generated secure random string
- [ ] `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

### Generate NEXTAUTH_SECRET:
```bash
# Linux/Mac:
openssl rand -base64 32

# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 🚀 Deployment Steps

1. [ ] Push code to main branch
2. [ ] Import project to Vercel (or connect existing)
3. [ ] Set environment variables in Vercel Dashboard
4. [ ] Deploy (automatic on push or manual)
5. [ ] Monitor build logs for errors
6. [ ] Run database migrations after first deploy
7. [ ] Test login functionality
8. [ ] Test equipment/IP management features

## 🗄️ Database Migration (After First Deploy)

```bash
# Option 1: Via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option 2: Via temporary API route (see VERCEL_DEPLOYMENT.md)
# Create /api/migrate route, call it once, then delete it
```

## ✅ Post-Deployment Verification

- [ ] Homepage loads correctly
- [ ] Login page is accessible
- [ ] Can log in with test credentials
- [ ] Dashboard displays data
- [ ] Equipment list loads
- [ ] IP management works
- [ ] Import/export functions work
- [ ] No console errors in browser
- [ ] No errors in Vercel function logs

## 🔧 If Issues Occur

1. Check Vercel build logs
2. Verify environment variables are set correctly
3. Check database connection string format
4. Ensure `NEXTAUTH_URL` matches deployment URL
5. Review VERCEL_DEPLOYMENT.md for detailed troubleshooting

---

**Quick Reference:**
- Full Guide: `VERCEL_DEPLOYMENT.md`
- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs

