// backend/scratch_cleanup.js
const mysql = require('mysql2/promise');

async function clean() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3308,
    user: 'domusfin_user',
    password: 'domusfin_password',
    database: 'domusfin_db'
  });

  console.log('Connected to MySQL database on port 3308.');

  // Clean duplicate payment methods
  const [resPm] = await connection.query(`
    DELETE p1 FROM payment_methods p1
    INNER JOIN payment_methods p2 
    ON p1.name = p2.name 
    AND p1.household_id = p2.household_id 
    AND p1.id > p2.id
  `);
  console.log(`Cleaned duplicates in payment_methods. Affected rows: ${resPm.affectedRows}`);

  // Clean duplicate categories
  const [resCat] = await connection.query(`
    DELETE c1 FROM categories c1
    INNER JOIN categories c2 
    ON c1.name = c2.name 
    AND c1.household_id = c2.household_id 
    AND c1.id > c2.id
  `);
  console.log(`Cleaned duplicates in categories. Affected rows: ${resCat.affectedRows}`);

  await connection.end();
  console.log('Database cleanup finished successfully!');
}

clean().catch(err => {
  console.error('Failed to clean database:', err);
  process.exit(1);
});
