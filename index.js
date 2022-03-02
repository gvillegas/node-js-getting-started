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

const apiHandler = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const sql = "SELECT ac.id, ac.first_name, ac.last_name, ac.phone, ac.agent_phone, TO_CHAR(ac.received_on_date, 'yyyy-MM-dd') as received_on_date, ac.received_on_time FROM all_calls ac WHERE received_on_date = (NOW() at time zone 'EST')::date";
    const result = await client.query(sql);
    const results = { results: result ? result.rows : [] };
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
  .get("/api/l33t", apiHandler)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
