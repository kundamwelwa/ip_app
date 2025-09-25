# Database Setup Instructions

## 1. Create Environment File

Create a `.env` file in the root directory with the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ip_management_db?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# App Configuration
NODE_ENV="development"
```

## 2. Update Database URL

Replace the DATABASE_URL with your actual PostgreSQL connection details:
- `username`: Your PostgreSQL username
- `password`: Your PostgreSQL password
- `localhost:5432`: Your PostgreSQL host and port
- `ip_management_db`: Your database name

## 3. Create Database

Create the database in PostgreSQL:

```sql
CREATE DATABASE ip_management_db;
```

## 4. Run Prisma Commands

After setting up the .env file, run these commands:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

## 5. Verify Setup

Start the development server:

```bash
npm run dev
```

The application should now be ready with:
- ✅ User registration and login
- ✅ Protected dashboard
- ✅ Database integration
- ✅ Session management

## Next Steps

1. Register a new user account
2. Login to access the dashboard
3. Start building IP management features
