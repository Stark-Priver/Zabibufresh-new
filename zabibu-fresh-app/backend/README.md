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

## 3. Supabase Storage Setup

A storage bucket is needed for product images.

1.  **Bucket Name**: `product-images`
2.  **Public Access**: `true` (as specified in project requirements)
3.  **Allowed MIME Types**: `image/png`, `image/jpeg`, `image/webp`
4.  **File Size Limit**: `10MB` (10485760 bytes)

**Option A: Using Supabase Dashboard (Manual)**

*   Navigate to `Storage` in your Supabase project dashboard.
*   Click `Create new bucket`.
*   Enter the bucket name (`product-images`).
*   Toggle "Public bucket" to **on**.
*   After creation, you can configure policies for allowed MIME types and file size limits through the dashboard or SQL.

**Option B: Using Supabase Admin SDK (Scripted)**

You can use a script with the Supabase Admin SDK (e.g., a Node.js script) to create and configure the bucket. This is useful for automating setup.

*   **Install Supabase Admin Client**:
    ```bash
    npm install @supabase/supabase-js # (if not already in your project for other admin tasks)
    # or typically use it in a separate admin script environment
    ```

*   **Example Script (`create_bucket.js` - run this from a secure environment, not your frontend app)**:

    ```javascript
    // This script should be run in a Node.js environment
    // where SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set as environment variables.
    // DO NOT expose your SERVICE_ROLE_KEY in the frontend.

    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key (secret)

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase URL or Service Role Key is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
      process.exit(1);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    async function setupStorage() {
      const bucketName = 'product-images';
      const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError.message);
        return;
      }

      const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);

      if (bucketExists) {
        console.log(`Bucket "${bucketName}" already exists.`);
        // Optionally, update policies here if needed
      } else {
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true, // As per requirements
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          fileSizeLimit: 10485760, // 10MB
        });

        if (error) {
          console.error(`Error creating bucket "${bucketName}":`, error.message);
        } else {
          console.log(`Bucket "${bucketName}" created successfully:`, data);
          console.log(`Please also set up Row Level Security (RLS) policies for granular access control if needed, beyond public readability.`);
          console.log(`For example, to allow authenticated users to upload:`);
          console.log(`
          CREATE POLICY "Allow authenticated uploads"
          ON storage.objects FOR INSERT TO authenticated
          WITH CHECK (bucket_id = '${bucketName}');
          `);
           console.log(`To make objects publicly readable (if bucket is public, this is often default but good to verify):`);
          console.log(`
          CREATE POLICY "Public read access"
          ON storage.objects FOR SELECT
          USING (bucket_id = '${bucketName}');
          `);
        }
      }
    }

    setupStorage();
    ```
    **To run this script:**
    1.  Save it as `create_bucket.js` (e.g., in a `scripts` folder in your project root, outside the frontend).
    2.  Set environment variables: `SUPABASE_URL` (your project URL) and `SUPABASE_SERVICE_ROLE_KEY` (found in API settings, keep this key very secure).
    3.  Run: `node create_bucket.js`

    **Note on RLS for Storage:**
    Even with a public bucket, you'll likely want to set up Row Level Security (RLS) policies on the `storage.objects` table to control who can upload, update, or delete files. The script above provides examples for common policies. You can apply these via the Supabase SQL editor.

## 4. Supabase Auth Configuration

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
