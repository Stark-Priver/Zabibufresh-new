# Backend Setup: Supabase & Prisma

This section outlines the setup for the backend services, primarily Supabase for authentication, database, and storage, and Prisma as the ORM.

## 1. Supabase Project Setup

1.  **Create a Supabase Project**:
    *   Go to [Supabase Dashboard](https://app.supabase.io/) and create a new project.
    *   Choose a strong password for your database and save it securely.
    *   Select the region closest to Dodoma, Tanzania, if available, for optimal performance.

2.  **Database Connection URL**:
    *   Navigate to `Project Settings` > `Database` > `Connection string`.
    *   Copy the `psql` connection string. This will be used as the `DATABASE_URL` for Prisma.
    *   **Important**: Replace `[YOUR-PASSWORD]` in the connection string with the database password you set during project creation.
    *   Example: `postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres`

3.  **API Keys**:
    *   Navigate to `Project Settings` > `API`.
    *   You will need the `Project URL` and the `anon` `public` key for your frontend application.
    *   Store these securely, typically in environment variables for your Expo app.

4.  **Environment Variables**:
    *   Create a `.env` file in the `zabibu-fresh-app/backend/prisma` directory (ensure this file is in `.gitignore` and not committed to version control).
    *   Add the `DATABASE_URL`:
        ```env
        DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"
        ```

## 2. Prisma Setup & Migration

Prisma is used to manage the database schema and migrations.

1.  **Install Prisma CLI** (if not already installed globally or as a project dev dependency):
    ```bash
    npm install prisma --save-dev
    # or
    yarn add prisma --dev
    ```
    *(This step will be handled by `npm install` or `yarn install` if `prisma` is added to `package.json` later)*

2.  **Initialize Prisma** (if not already done by creating `schema.prisma` manually):
    The `schema.prisma` file has already been created in `zabibu-fresh-app/backend/prisma/`. It defines the database models: `User`, `Product`, `Message`, and the `Role` enum.

3.  **Run Prisma Migration**:
    *   Once your `DATABASE_URL` is set in `.env` and your Supabase database is ready, run the initial migration:
        ```bash
        cd zabibu-fresh-app/backend/prisma
        npx prisma migrate dev --name init
        ```
    *   This command will:
        *   Create a `migrations` folder with SQL migration files.
        *   Apply the schema changes to your Supabase database.
        *   Generate the Prisma Client based on your schema.

4.  **Prisma Client Generation**:
    *   The Prisma Client is a type-safe query builder. It's typically generated automatically after a migration. If you need to regenerate it manually:
        ```bash
        npx prisma generate
        ```

## 3. Supabase Auth Configuration

*   **Email/Password Auth**: Enabled by default.
*   **Phone Auth**:
    *   Navigate to `Authentication` > `Providers` in your Supabase dashboard.
    *   Enable `Phone Auth`. You might need to configure a Twilio (or other SMS provider) account if you want OTP verification for phone sign-ups, though Supabase also supports password-based phone auth. The project description implies password-based auth for phone.
*   **Role Selection**:
    *   The user `role` (`seller` or `buyer`) will be stored in the `public.User` table (managed by Prisma).
    *   During signup, your application logic will need to capture this role and save it alongside other user details. Supabase Auth itself doesn't directly manage custom roles in this way out-of-the-box; it typically uses the `auth.users` table. You'll link your `public.User` profile table to `auth.users` using the user's ID.
    *   Consider creating a Supabase Function (triggered on new auth user creation) to automatically create a corresponding entry in your `public.User` table, or handle this profile creation from your application client-side after successful signup.

This completes the backend setup documentation.
The next step will be to initialize the Expo frontend.
