# CodexCity - AI Email Automation

CodexCity is a web application designed to help users automate their email management using AI-powered classification and personalized template-based responses. It integrates with Gmail to process incoming emails and send replies.

## Features

- **Supabase Authentication**: Secure user login with email/password and Google OAuth.
- **Gmail Integration**: Connect your Gmail account using OAuth 2.0 to allow the app to:
    - Fetch new emails.
    - Classify emails using basic keyword matching (Order Inquiry, Support Request, General).
    - Send automated replies based on customizable templates.
- **Template Management**: Create and manage email templates for different categories.
- **Email Logging**: View a log of processed emails and the actions taken.
- **Manual Override**: Toggle automated responses on/off.
- **In-App Tour**: A brief tour for new users explaining the main setup steps.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Authentication, Database)
- **Email API**: Gmail API

## Basic Setup Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd codexcity
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    *   Copy the `.env.example` file to a new file named `.env`.
    *   Populate the `.env` file with your credentials (see "Environment Variables" section below).
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running, typically at `http://localhost:5173`.

## Environment Variables

You need to create a `.env` file in the root of the project and populate it with the following variables:

```
# Supabase Configuration
VITE_SUPABASE_URL="your_supabase_url_here"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Gmail API OAuth Credentials
# These are obtained from your Google Cloud Console project.
# 1. Go to Google Cloud Console (https://console.cloud.google.com/).
# 2. Create a new project or select an existing one.
# 3. Enable the "Gmail API" for your project (APIs & Services > Library).
# 4. Go to "APIs & Services" > "Credentials".
# 5. Click "+ CREATE CREDENTIALS" and choose "OAuth client ID".
# 6. Select "Web application" as the application type.
# 7. Add Authorized JavaScript origins (e.g., http://localhost:5173 for dev, your production URL).
# 8. Add Authorized redirect URIs:
#    - For local development: http://localhost:5173/auth/gmail/callback
#    - For production: https://your_production_domain.com/auth/gmail/callback
# 9. After creation, copy the Client ID and Client Secret.
VITE_GMAIL_CLIENT_ID="your_gmail_client_id_here"
VITE_GMAIL_CLIENT_SECRET="your_gmail_client_secret_here"
VITE_GMAIL_REDIRECT_URI="http://localhost:5173/auth/gmail/callback" # Update for production
```

## Supabase Project Setup

1.  **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Database Schema**:
    *   The application relies on specific tables and columns (e.g., `user_gmail_tokens`, `email_templates`, `email_logs`, `users`).
    *   Some tables might be created by Supabase Auth, but others need to be set up manually or via migrations if provided (check the `supabase/migrations` folder if it exists).
    *   **Important Manual Database Change**: A `manual_override_active` column needs to be added to your `users` table (this is the public `users` table, not `auth.users`).
        ```sql
        -- SQL to add the manual_override_active column to your 'users' table in Supabase
        -- Ensure you are running this in the Supabase SQL Editor for the correct project.
        -- This table should be the public 'users' table that you use to store user profile information,
        -- linked one-to-one with the auth.users table.

        ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS manual_override_active BOOLEAN DEFAULT FALSE;

        -- If you haven't created a public 'users' table yet that's linked to auth.users,
        -- you would typically do so like this (example):
        --
        -- CREATE TABLE public.users (
        --   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        --   email TEXT,
        --   updated_at TIMESTAMPTZ,
        --   -- other profile fields
        --   manual_override_active BOOLEAN DEFAULT FALSE
        -- );
        --
        -- And set up row level security (RLS) policies accordingly.
        -- For example, to allow users to update their own manual_override_active status:
        --
        -- CREATE POLICY "Users can update their own manual_override_active status"
        -- ON public.users
        -- FOR UPDATE USING (auth.uid() = id)
        -- WITH CHECK (auth.uid() = id);
        --
        -- CREATE POLICY "Users can view their own profile"
        -- ON public.users
        -- FOR SELECT USING (auth.uid() = id);

        ```
        *Note*: The application's `getCurrentUser` and `updateUserManualOverride` functions in `src/lib/supabase.ts` target a table named `users` for storing and retrieving the `manual_override_active` field. Ensure this table exists and is structured correctly, linking to `auth.users.id`.

3.  **Google OAuth Provider**: In your Supabase project, go to Authentication > Providers and enable Google. You'll need to provide the Client ID and Client Secret obtained from your Google Cloud project here as well (the same ones used for `VITE_GMAIL_CLIENT_ID` and `VITE_GMAIL_CLIENT_SECRET`). Ensure the Supabase redirect URI (e.g., `https://<your-supabase-id>.supabase.co/auth/v1/callback`) is also added to your Google Cloud OAuth "Authorized redirect URIs".

## Gmail OAuth Configuration (Google Cloud Console)

As detailed in the Environment Variables section, you must:
1.  Create or use an existing Google Cloud Project.
2.  Enable the Gmail API.
3.  Create OAuth 2.0 Credentials (Web application type).
4.  Configure Authorized JavaScript Origins and **Authorized Redirect URIs**. The redirect URI for the app itself (e.g., `http://localhost:5173/auth/gmail/callback` or your production equivalent) is crucial for the Gmail connection within the app. The Supabase callback URI is for the Supabase Google login.

This `README.md` provides a good overview and setup instructions.
The SQL reminder for `manual_override_active` clarifies that it's for the public `users` table, provides an example of how to add it, and even a sample table structure and RLS policies, which is very helpful for someone setting up the project.

---
This Project is under MIT License
