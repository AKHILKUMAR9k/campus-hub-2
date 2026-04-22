# Deployment Guide - Campus Hub

This guide details how to deploy the **Campus Hub** application to production
using **Vercel** (Frontend/API) and **Supabase** (Database/Auth).

## Prerequisites

- A [GitHub](https://github.com) account.
- A [Vercel](https://vercel.com) account.
- A [Supabase](https://supabase.com) account.

## 1. Supabase Setup (Production Project)

1. **Create a new Project**: Log in to Supabase and create a new project.
2. **Database Migration**:
   - Go to the **SQL Editor** in your new project.
   - Copy the contents of your local migration files (or export your local
     schema using `supabase db dump`) and run them in the SQL Editor.
   - _Crucial_: Ensure all tables (`users`, `events`, `registrations`, `clubs`,
     etc.) and Row Level Security (RLS) policies are created.
3. **Authentication**:
   - Go to **Authentication -> URL Configuration**.
   - Set the **Site URL** to your production domain (e.g.,
     `https://your-project.vercel.app`).
   - Add `https://your-project.vercel.app/**` to **Redirect URLs**.
4. **Get Credentials**:
   - Go to **Project Settings -> API**.
   - Copy the `Project URL` and `anon` public key.

## 2. Vercel Deployment

1. **Push to GitHub**: Ensure your latest code is pushed to a GitHub repository.
2. **Import Project in Vercel**:
   - Dashboard -> Add New -> Project.
   - Select your GitHub repository.
3. **Configure Environment Variables**:
   - Add the following variables in the Vercel deployment screen:
     - `NEXT_PUBLIC_SUPABASE_URL`: (Your Production Project URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Your Production Anon Key)
   - _Optional (for future features)_:
     - `SUPABASE_SERVICE_ROLE_KEY`: (If you use admin scripts)
     - SMTP variables for email (`SMTP_HOST`, `SMTP_USER`, etc.)
4. **Deploy**: Click **Deploy**. Vercel will build and deploy your Next.js app.

## 3. Post-Deployment Verification

1. **Visit URL**: Go to your deployed Vercel URL.
2. **Sign Up**: Create a new account to test authentication.
3. **Admin Setup**:
   - Since it's a fresh database, you need to make yourself an admin.
   - Go to Supabase -> Table Editor -> `users`.
   - Find your user row and change the `role` column from `student` to `admin`.
4. **Test Features**:
   - Create an event.
   - Register for it.
   - Check the dashboard.

## Troubleshooting

- **"AuthApiError: Redirect URL not allowed"**: Check Supabase Auth settings to
  ensure your Vercel domain is in the allowed Redirect URLs.
- **Build Failures**: Check Vercel logs. Common issues include type errors (run
  `npm run build` locally to check) or missing environment variables.
- **Images not loading**: If using Supabase Storage, ensure your bucket policies
  are set to "Public".

## Deployment Checklist

- [ ] Database Schema Applied
- [ ] RLS Policies Enabled
- [ ] Env Variables Configured in Vercel
- [ ] Auth Redirect URLs Updated
- [ ] First Admin User Promoted manually
