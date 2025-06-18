# CodexCity Production Setup Guide

## 🚀 Complete Setup Verification and Production Deployment

This guide will help you verify your Supabase setup and prepare Google Cloud for production to resolve the loading screen issue and remove the "unverified app" warning.

## 📋 Current Issues Analysis

Based on your description, you're experiencing:
1. **Loading screen stuck** - Likely due to missing `public.users` table or RLS policies
2. **"Google hasn't verified this app"** - Your OAuth consent screen needs production approval
3. **Gmail callback working** - Good! The redirect is functioning correctly

## 🔧 Step 1: Verify and Fix Supabase Database

### Check Current Database State

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor**
4. Check if you have these tables:
   - `user_gmail_tokens` ✅
   - `email_templates` ✅  
   - `email_logs` ✅
   - `users` ❓ (This might be missing!)

### Create Missing Users Table

If the `users` table is missing, go to **SQL Editor** and run:

```sql
-- Create public users table linked to auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  manual_override_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing auth users to have profiles
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
```

### Verify RLS Policies

Check that all tables have proper Row Level Security:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_gmail_tokens', 'email_templates', 'email_logs');

-- Should show rowsecurity = true for all tables
```

## 🔐 Step 2: Google Cloud Production Setup

### OAuth Consent Screen Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **OAuth consent screen**

### Required Information for Production:

**App Information:**
- App name: `CodexCity - AI Email Automation`
- User support email: `your-email@domain.com`
- App logo: Upload a 120x120px logo
- App domain: `https://silly-paprenjak-c84f70.netlify.app`

**Developer Contact Information:**
- Email addresses: `your-email@domain.com`

**App Domain Verification:**
- Homepage: `https://silly-paprenjak-c84f70.netlify.app`
- Privacy policy: `https://silly-paprenjak-c84f70.netlify.app/privacy.html`
- Terms of service: `https://silly-paprenjak-c84f70.netlify.app/terms.html`

**Scopes:**
- `https://www.googleapis.com/auth/gmail.modify`
- Justification: "Required to read incoming emails, classify them using AI, and send automated responses based on user-configured templates."

**Test Users (for now):**
- Add your email and any other test users
- Maximum 100 test users allowed

### Authorized Domains

Add these to your authorized domains:
- `silly-paprenjak-c84f70.netlify.app`
- `netlify.app` (for subdomain support)

### OAuth Client Configuration

In **Credentials** > **OAuth 2.0 Client IDs**:

**Authorized JavaScript origins:**
- `https://silly-paprenjak-c84f70.netlify.app`
- `http://localhost:5173` (for development)

**Authorized redirect URIs:**
- `https://silly-paprenjak-c84f70.netlify.app/auth/gmail/callback`
- `http://localhost:5173/auth/gmail/callback`
- `https://[your-supabase-id].supabase.co/auth/v1/callback` (for Supabase Google auth)

## 📄 Step 3: Legal Pages Setup

You need privacy policy and terms of service pages for production approval.

## 🧪 Step 4: Testing Checklist

### Database Verification:
- [ ] `public.users` table exists
- [ ] RLS policies are active
- [ ] User profiles are created automatically
- [ ] Manual override field works

### Authentication Flow:
- [ ] Supabase Google OAuth works
- [ ] User profile is created on first login
- [ ] Gmail OAuth redirects correctly
- [ ] Tokens are stored properly

### Gmail Integration:
- [ ] Gmail connection works
- [ ] Tokens are refreshed automatically
- [ ] Email classification functions
- [ ] Template system works

## 🚀 Step 5: Production Deployment

### Environment Variables Check

Ensure your production environment has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GMAIL_CLIENT_ID=your-google-client-id
VITE_GMAIL_CLIENT_SECRET=your-google-client-secret
VITE_GMAIL_REDIRECT_URI=https://silly-paprenjak-c84f70.netlify.app/auth/gmail/callback
```

### Netlify Configuration

Your `_redirects` file should contain:
```
/* /index.html 200
```

## 🔍 Troubleshooting Common Issues

### Loading Screen Stuck
**Cause:** Missing `public.users` table or RLS policies
**Solution:** Run the SQL commands in Step 1

### "Google hasn't verified this app"
**Cause:** OAuth consent screen not submitted for production
**Solution:** Complete Step 2 and submit for verification

### Gmail Callback 404
**Cause:** Missing redirect rules
**Solution:** Ensure `_redirects` file is in `public/` folder

### Token Storage Fails
**Cause:** RLS policies blocking token storage
**Solution:** Verify service role policies exist

## 📞 Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Check browser console for JavaScript errors
3. Verify all environment variables are set
4. Test with a fresh incognito browser session

## 🎯 Success Criteria

Your setup is complete when:
- ✅ Users can sign in with Google (Supabase)
- ✅ Users can connect Gmail without "unverified app" warning
- ✅ Email templates are created automatically
- ✅ Manual override toggle works
- ✅ Email logs are recorded properly