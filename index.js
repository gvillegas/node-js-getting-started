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

const buildErrorJson = (message) => ({ error: message });

const dailyCallsApiHandler = async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const sql = `SELECT ac.id, ac.first_name, ac.last_name, ac.phone, ac.agent_phone, 
      TO_CHAR(ac.received_on_date, 'yyyy-MM-dd') as received_on_date, ac.received_on_time 
      FROM all_calls ac 
      WHERE received_on_date = (NOW() at time zone 'EST')::date`;

    const result = await client.query(sql);
    const responseBody = { calls: result ? result.rows : [] };
    res.json(responseBody);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(buildErrorJson("request cannot be handled, please retry later"));
  } finally {
    try {
      client.release();
    } catch (e) {
      // close quietly
    }
  }
};

const countriesApiHandler = async (req, res) => {
  const { phoneCode } = req.params;

  if (!phoneCode) {
    return res
      .status(400)
      .json(buildErrorJson("country's phone code is required"));
  }

  let client;

  try {
    client = await pool.connect();
    const sql = "SELECT c.phonecode, c.nicename FROM countries c WHERE c.phonecode::text = $1";
    const result = await client.query(sql, [phoneCode]);
    let countries;

    if (result && result.rows && result.rows.length) {
      countries = result.rows.map((row) => {
        const { phonecode, nicename } = row;
        return { code: phonecode, name: nicename };
      });
    } else {
      return res.status(404).json(buildErrorJson("country not found"));
    }

    res.json({ countries });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(buildErrorJson("request cannot be handled, please retry later"));
  } finally {
    try {
      client.release();
    } catch (e) {
      // close quietly
    }
  }
};

const countriesJsonApiHandler = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const sql = "SELECT c.phonecode, c.nicename FROM countries c ORDER BY c.nicename";
    const result = await client.query(sql);
    let countries;

    if (result && result.rows && result.rows.length) {
      countries = result.rows.map((row) => {
        const { phonecode, nicename } = row;
        return { code: phonecode, name: nicename };
      });
    } else {
      return res.status(404).json(buildErrorJson("country not found"));
    }

    res.json({ countries });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(buildErrorJson("request cannot be handled, please retry later"));
  } finally {
    try {
      client.release();
    } catch (e) {
      // close quietly
    }
  }
};

/** App */

express()
  .get("/api/calls/daily", dailyCallsApiHandler)
  .get("/api/countries/:phoneCode([0-9]+)", countriesApiHandler)
  .get("/api/countries/json", countriesJsonApiHandler)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
