import pg from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), 'backend', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query('SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;');
    console.log('--- AUDIT LOGS ---');
    console.log(JSON.stringify(res.rows, null, 2));
    
    const countRes = await pool.query('SELECT COUNT(*) FROM "AuditLog";');
    console.log('Total audit logs:', countRes.rows[0].count);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

check();
