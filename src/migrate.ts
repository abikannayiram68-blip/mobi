import pg from 'pg';
import { SEED_PRODUCTS } from './types.js';

const connectionString = `postgresql://postgres:Abi%402005-1968@db.azwtmgexcksfhhcitemr.supabase.co:5432/postgres`;

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL database for schema setup...');
  const client = new pg.Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected. Creating tables if they do not exist...');

    // 1. Create PRODUCTS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        discount_price NUMERIC,
        category TEXT NOT NULL,
        stock_quantity INTEGER NOT NULL,
        image_url TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Products table verified.');

    // 2. Create ORDERS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        items JSONB NOT NULL,
        total_amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        status_history JSONB NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Orders table verified.');

    // 3. Create TICKETS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tickets table verified.');

    // 4. Create NOTIFICATIONS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('order', 'ticket', 'system')),
        user_id TEXT NOT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Notifications table verified.');

    // 4b. Create APP_USERS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ App users table verified.');

    // 4c. Create PENDING_OTPS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_otps (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Pending OTPs table verified.');

    // 4d. Create WISHLISTS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
    `);
    console.log('✅ Wishlists table verified.');

    // 5. Seed PRODUCTS table if empty
    const checkProductCount = await client.query('SELECT COUNT(*) FROM products;');
    const count = parseInt(checkProductCount.rows[0].count);
    
    if (count === 0) {
      console.log('Product catalog is empty. Seeding catalog...');
      for (const prod of SEED_PRODUCTS) {
        await client.query(
          `INSERT INTO products (id, name, description, price, discount_price, category, stock_quantity, image_url, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
          [
            prod.id,
            prod.name,
            prod.description,
            prod.price,
            prod.discount_price,
            prod.category,
            prod.stock_quantity,
            prod.image_url,
            prod.status,
            prod.created_at
          ]
        );
      }
      console.log(`✅ Successfully seeded ${SEED_PRODUCTS.length} standard products.`);
    } else {
      console.log(`ℹ️ Catalog already has ${count} items. Skipping seed.`);
    }

    console.log('🎉 SUPABASE SETUP COMPLETED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
