import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import pg from "pg";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import fs from "fs";
import { SEED_PRODUCTS } from "./src/types.js";

// Fix local lookup issues in sandbox
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const connectionString = `postgresql://postgres:Abi%402005-1968@db.azwtmgexcksfhhcitemr.supabase.co:5432/ecommerce`;
const pool = new pg.Pool({ connectionString });

// Automated database schema validation and updates to handle pre-existing table modifications
async function runDbMigration() {
  console.log("⚙️ Checking database schema for pre-existing tables and repairing any missing columns...");
  try {
    // 1. Ensure basic tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        category TEXT NOT NULL,
        stock_quantity INTEGER NOT NULL
      );
    `);

    // 2. Add missing columns using safe ALTER TABLE ADD COLUMN IF NOT EXISTS
    const alterQueries = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC;`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,

      // Orders
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        items JSONB NOT NULL,
        total_amount NUMERIC NOT NULL,
        status TEXT NOT NULL
      );`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;`,
      `ALTER TABLE orders ALTER COLUMN id TYPE TEXT;`,
      `ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;`,

      // Tickets
      `CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        messages JSONB NOT NULL
      );`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,

      // Notifications
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        user_id TEXT NOT NULL
      );`,
      `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,

      // Users
      `CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL
      );`,
      `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,

      // Pending OTPs
      `CREATE TABLE IF NOT EXISTS pending_otps (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );`,
      `ALTER TABLE pending_otps ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,

      // Wishlists
      `CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );`
    ];

    for (const q of alterQueries) {
      try {
        await pool.query(q);
      } catch (colErr: any) {
        console.warn(`Note: Schema query warning on: "${q.substring(0, 45)}..." ->`, colErr.message);
      }
    }

    // Try adding separate check constraints safely
    try {
      await pool.query(`ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive'));`);
    } catch (e) {}

    try {
      await pool.query(`ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('order', 'ticket', 'system'));`);
    } catch (e) {}

    try {
      await pool.query(`ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('customer', 'admin'));`);
    } catch (e) {}

    // 9. Auto-seed products if database catalog is completely empty
    const checkCount = await pool.query("SELECT COUNT(*) FROM products;");
    const count = parseInt(checkCount.rows[0].count, 10);
    if (count === 0 && SEED_PRODUCTS && SEED_PRODUCTS.length > 0) {
      console.log(`Product catalog is empty. Auto-seeding ${SEED_PRODUCTS.length} standard products on startup...`);
      for (const prod of SEED_PRODUCTS) {
        await pool.query(
          `INSERT INTO products (id, name, description, price, discount_price, category, stock_quantity, image_url, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING;`,
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
            prod.created_at || new Date().toISOString()
          ]
        );
      }
      console.log("✅ Seeded products catalog successfully.");
    }

    console.log("✅ Database schema validation & updates completed successfully.");
  } catch (err: any) {
    console.error("❌ Schema alignment failed:", err);
  }
}

// Pre-seed an Administrator account on startup to make testing beautiful
async function seedDefaultAdmin() {
  try {
    await runDbMigration();
    await pool.query(`
      INSERT INTO app_users (id, email, password, full_name, role)
      VALUES ('admin-001', 'admin@example.com', 'admin123', 'System Administrator', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log("✅ Seeded default admin account (admin@example.com / admin123)");
  } catch (err) {
    console.error("Warning: Error seeding default admin:", err);
  }
}

seedDefaultAdmin();
createTransporter();

// SMTP transporter helper (lazy initialized when needed)
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const debugInfo = {
    host,
    port,
    user,
    hasPass: !!pass,
    secureEnv: process.env.SMTP_SECURE
  };

  console.log("⚙️ SMTP Configuration Check:", debugInfo);
  try {
    fs.writeFileSync(path.join(process.cwd(), "smtp_log.txt"), JSON.stringify(debugInfo, null, 2));
  } catch (fErr) {
    console.error("Failed to write smtp_log.txt", fErr);
  }

  if (!host || !user || !pass) {
    console.warn("⚠️ SMTP Credentials missing or incomplete. OTP will run in local SIMULATION mode.");
    return null;
  }

  // Smart-resolving secure flag based on SMTP port or explicit configuration override
  let secure = process.env.SMTP_SECURE === "true";
  if (port === 465) {
    secure = true;
  } else if (port === 587 || port === 2525) {
    secure = false;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
    // Make connection highly resilient against handshake bugs in sandbox environments
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    // Prevent sudden unexpected socket closures on slow server handshakes
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

// REST AUTHENTICATION ROUTES

// 1. Send OTP for Registration Confirmation
app.post("/api/auth/register-otp", async (req, res) => {
  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: "Missing required fields (email, password, fullName, role)." });
  }

  try {
    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Check if user already exists
    const userCheck = await pool.query("SELECT id FROM app_users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "A user with this email address already exists." });
    }

    // Upsert pending verification info
    await pool.query(`
      INSERT INTO pending_otps (email, password, full_name, role, otp, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE
      SET password = $2, full_name = $3, role = $4, otp = $5, expires_at = $6
    `, [email, password, fullName, role, otp, expiresAt]);

    const transporter = createTransporter();
    if (transporter) {
      const from = process.env.SMTP_FROM || `MobiShop Auth <${process.env.SMTP_USER}>`;
      const mailOptions = {
        from,
        to: email,
        subject: `Your OTP Code for MobiShop ${role === 'admin' ? 'Admin Portal' : 'Store'} Registration`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #2563eb; text-align: center; font-size: 24px; margin-bottom: 20px;">MobiShop Security Verifier</h2>
            <p style="font-size: 15px; color: #334155; line-height: 1.5;">Hello <b>${fullName}</b>,</p>
            <p style="font-size: 15px; color: #334155; line-height: 1.5;">Thank you for registering. Please confirm your ${role} registration with the following One-Time Password (OTP):</p>
            <div style="text-align: center; padding: 15px; margin: 25px 0; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.5;">This OTP is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`📨 Sent SMTP email OTP to: ${email}`);
        return res.json({ success: true, mode: "smtp", message: "OTP sent securely via SMTP." });
      } catch (smtpErr) {
        console.error(`❌ SMTP delivery failed, falling back to simulated mode:`, smtpErr);
        return res.json({
          success: true,
          mode: "simulated",
          otp,
          message: "SMTP sending failed. Displayed simulated passcode fallback."
        });
      }
    } else {
      // Graceful Simulation mode when SMTP env parameters are missing
      console.log(`🚀 [SIMULATION MODE] Generated verification OTP for email: ${email} -> CODE: ${otp}`);
      return res.json({ 
        success: true, 
        mode: "simulated", 
        otp, 
        message: "Developer simulation fallback active. Real credentials can be configured in .env." 
      });
    }

  } catch (err: any) {
    console.error("Error generating or sending OTP:", err);
    return res.status(500).json({ error: "Server error occurred while preparing authentication email." });
  }
});

// 2. Confirm registration via OTP
app.post("/api/auth/register-confirm", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Missing email or OTP verification code." });
  }

  try {
    const pendingQuery = await pool.query("SELECT * FROM pending_otps WHERE email = $1", [email]);
    if (pendingQuery.rows.length === 0) {
      return res.status(400).json({ error: "No registration attempts found for this email." });
    }

    const record = pendingQuery.rows[0];
    
    // Check if expiration time is exceeded
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "This OTP code has expired. Please request a new one." });
    }

    // Check if OTP matches
    if (record.otp !== otp) {
      return res.status(400).json({ error: "Incorrect verification code. Please check and try again." });
    }

    // Generate unique user identifier
    const id = record.role === "admin" 
      ? `admin-${Math.floor(100 + Math.random() * 900)}` 
      : `cust-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create user in primary APP_USERS table
    await pool.query(`
      INSERT INTO app_users (id, email, password, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, record.email, record.password, record.full_name, record.role]);

    // Clean up temporary OTP record
    await pool.query("DELETE FROM pending_otps WHERE email = $1", [email]);

    console.log(`🎉 Account verified and created: ${record.email} (${record.role})`);
    return res.json({ 
      success: true, 
      user: {
        id,
        email: record.email,
        fullName: record.full_name,
        role: record.role
      } 
    });

  } catch (err: any) {
    console.error("Error confirming OTP:", err);
    return res.status(500).json({ error: "Failed to verify registration code. Database error." });
  }
});

// 3. User Login (Supporting separated user paths)
app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Please enter your email, password, and chosen role." });
  }

  try {
    const userQuery = await pool.query("SELECT * FROM app_users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: "Incorrect details. Check your email or registration status." });
    }

    const user = userQuery.rows[0];
    
    // Role filter boundary
    if (user.role !== role) {
      return res.status(401).json({ error: `Selected role (${role}) does not match this user's profile.` });
    }

    // Secure plain-text password match
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password key. Please try again." });
    }

    console.log(`🔑 Login successful: ${user.email} (${user.role})`);
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });

  } catch (err: any) {
    console.error("Error standard login query:", err);
    return res.status(500).json({ error: "A server side error occurred on authentication login check." });
  }
});

// WISHLIST MANAGEMENT ENDPOINTS
app.get("/api/wishlist", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Missing required parameter user_id" });
  }
  try {
    const result = await pool.query(
      `SELECT p.* FROM wishlists w 
       JOIN products p ON w.product_id = p.id::text 
       WHERE w.user_id = $1 
       ORDER BY w.created_at DESC`,
      [user_id]
    );
    const wishlistProducts = result.rows.map((row: any) => ({
      ...row,
      price: parseFloat(row.price),
      discount_price: row.discount_price ? parseFloat(row.discount_price) : null
    }));
    return res.json(wishlistProducts);
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    return res.status(500).json({ error: "Database error retrieving wishlist items." });
  }
});

app.post("/api/wishlist", async (req, res) => {
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) {
    return res.status(400).json({ error: "Missing required fields (user_id, product_id)" });
  }
  try {
    await pool.query(
      `INSERT INTO wishlists (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [user_id, product_id]
    );
    return res.json({ success: true, message: "Added to wishlist successfully." });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    return res.status(500).json({ error: "Database error saving wishlist item." });
  }
});

app.delete("/api/wishlist", async (req, res) => {
  const user_id = req.body.user_id || req.query.user_id;
  const product_id = req.body.product_id || req.query.product_id;
  if (!user_id || !product_id) {
    return res.status(400).json({ error: "Missing required fields (user_id, product_id)" });
  }
  try {
    await pool.query(
      `DELETE FROM wishlists 
       WHERE user_id = $1 AND product_id = $2`,
      [user_id, product_id]
    );
    return res.json({ success: true, message: "Removed from wishlist successfully." });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    return res.status(500).json({ error: "Database error deleting wishlist item." });
  }
});
// ORDERS MANAGEMENT ENDPOINTS

// Get orders for a user
app.get("/api/orders", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Missing required parameter user_id" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ error: "Database error retrieving orders." });
  }
});

// Create a new order
app.post("/api/orders", async (req, res) => {
  const { id, user_id, customer_name, customer_email, items, total_amount, status, shipping_address, payment_method, status_history } = req.body;
  if (!user_id || !items || !total_amount) {
    return res.status(400).json({ error: "Missing required order fields." });
  }
  try {
    const orderId = id || `ord-${Date.now()}`;
    await pool.query(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, items, total_amount, status, shipping_address, payment_method, status_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        orderId,
        user_id,
        customer_name || 'Customer',
        customer_email || '',
        JSON.stringify(items),
        total_amount,
        status || 'Placed',
        shipping_address || '',
        payment_method || '',
        status_history || '[]'
      ]
    );
    console.log(`🛒 New order placed: ${orderId} by ${customer_email}`);
    return res.json({ success: true, orderId });
  } catch (err: any) {
    console.error("Error creating order:", err);
    return res.status(500).json({ error: "Database error creating order." });
  }
});

// PRODUCTS ENDPOINT (for mobile catalog)
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC`
    );
    const products = result.rows.map((row: any) => ({
      ...row,
      price: parseFloat(row.price),
      discount_price: row.discount_price ? parseFloat(row.discount_price) : null
    }));
    return res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ error: "Database error retrieving products." });
  }
});

// APK Download Route
app.get("/api/app-download", (req, res) => {
  const apkPath = path.join(process.cwd(), "mobile-app.apk");
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, "MobiShop.apk");
  } else {
    res.status(404).json({ error: "APK file not found. Build it first with 'eas build'." });
  }
});

// Integrating Vite Dev Server / Static Ingress
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Portal backend service running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
