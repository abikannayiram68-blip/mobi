import pg from 'pg';

const connectionString = `postgresql://postgres:Abi%402005-1968@db.azwtmgexcksfhhcitemr.supabase.co:5432/postgres`;

async function fixTrigger() {
  console.log('Connecting to database...');
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected. Running SQL commands...');

    // 1. Ensure profiles table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL,
          full_name TEXT,
          role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ profiles table verified.');

    // 2. Drop existing trigger if it exists
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);
    console.log('✅ Dropped existing trigger.');

    // 3. Create or replace the profile insert trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
          'customer'
        );
        RETURN new;
      EXCEPTION WHEN OTHERS THEN
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ Created trigger function with security definer and safety exception handler.');

    // 4. Bind the trigger to run on auth.users after insert
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log('✅ Re-created trigger on auth.users.');
    
    console.log('🎉 Fix completed successfully.');
  } catch (err: any) {
    console.error('❌ Error executing fix:', err.message);
  } finally {
    await client.end();
  }
}

fixTrigger();
