const mysqlConfig = require('./config/mysql');

async function migrate() {
  const pool = await mysqlConfig.getPool();

  const univCols = [
    'finance_email VARCHAR(128) NULL',
    "institution_type VARCHAR(128) NULL DEFAULT 'State Public University'",
    "state VARCHAR(100) NULL DEFAULT 'Karnataka'",
    'district VARCHAR(100) NULL',
    'address TEXT NULL',
    'affiliated_university VARCHAR(255) NULL'
  ];

  for (const col of univCols) {
    const colName = col.split(' ')[0];
    try {
      await pool.query(`ALTER TABLE universities ADD COLUMN ${col}`);
      console.log(`Added ${colName} to universities`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`${colName} already exists in universities`);
      } else {
        console.error(`Error adding ${colName} to universities:`, e.message);
      }
    }
  }

  const acctCols = [
    'account_holder_name VARCHAR(128) NULL',
    'description TEXT NULL'
  ];

  for (const col of acctCols) {
    const colName = col.split(' ')[0];
    try {
      await pool.query(`ALTER TABLE bank_accounts ADD COLUMN ${col}`);
      console.log(`Added ${colName} to bank_accounts`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`${colName} already exists in bank_accounts`);
      } else {
        console.error(`Error adding ${colName} to bank_accounts:`, e.message);
      }
    }
  }

  const userCols = [
    'activation_token VARCHAR(255) NULL',
    'activation_token_expires_at TIMESTAMP NULL'
  ];

  for (const col of userCols) {
    const colName = col.split(' ')[0];
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN ${col}`);
      console.log(`Added ${colName} to users`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`${colName} already exists in users`);
      } else {
        console.error(`Error adding ${colName} to users:`, e.message);
      }
    }
  }

  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
