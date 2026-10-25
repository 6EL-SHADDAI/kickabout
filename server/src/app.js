const express = require("express"); 
const cors = require("cors"); 
const pool = require("./db/pool"); 

const app = express(); 

app.use(cors());
app.use(express.json()); 

app.get("/api/health", async (req, res) => { 
    try { 
        await pool.query("SELECT 1"); 
        res.json({ status: "ok"}); 
    } catch (err) { 
        console.error(err); 
        res.status(500).json({ status: "database unreachable" }); 
    }
}); 

module.exports = app; 