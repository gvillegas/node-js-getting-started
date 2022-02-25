const express = require("express");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const PORT = process.env.PORT || 5000;

/** API handlers */

const homeHandler = async (req, res) => res.json({ home: true });

const apiHandler = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const result = await client.query("SELECT * FROM test_table");
    const results = { results: result ? result.rows : null };
    res.json(results);
  } catch (err) {
    console.error(err);
    res.send(err);
  } finally {
    try {
      client.release();
    } catch(e) {
      // close quietly
    }
    
  }
};

/** App */

express()
  .get("/", homeHandler)
  .get("/api/6a095a", apiHandler)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
