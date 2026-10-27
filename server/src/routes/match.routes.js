// top of the file and schema 
const express = require("express"); 
const { z } = require("zod"); 

const pool = require("../db/pool");
const validate = require("../middleware/validate"); 
const requireAuth  = require("../middleware/auth"); 

const router = express.Router(); 

// Schema
const createMatchSchema = z.object({
    title: z.string().trim().min(1, "Title is required"), 
    venue: z.string().trim().min(1,"Venue is required"), 
    city: z.string().trim().min(1,"City is required"), 
    kickoffAt: z 
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid  date")
    .refine((v) => Date.parse(v) > Date.now(), "Kickoff must be in the future"), 
    maxPlayers: z.number().int().min(2).max(30), 
});

// creating a match 
// POST /api/matches 
router.post("/", requireAuth, validate(createMatchSchema), async (req, res) => {
  const { title, venue, city, kickoffAt, maxPlayers } = req.body;

  // Query 1: create the match and get the new row back
  const { rows } = await pool.query(
    `INSERT INTO matches (organiser_id, title, venue, city, kickoff_at, max_players)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.id, title, venue, city, kickoffAt, maxPlayers]
  );
  const match = rows[0];

  // Query 2: add the organiser as the first confirmed player
  // TODO (Day 6): these two inserts should be one atomic transaction
  await pool.query(
    `INSERT INTO participants (match_id, user_id, status)
     VALUES ($1, $2, 'confirmed')`,
    [match.id, req.user.id]
  );

  res.status(201).json({match}); 
});

// List upcoming matches
//  GET  /api/matches 
router.get("/", async (req, res) => { 
    const { rows } = await pool.query( 
        `SELECT m.*, 
            u.name AS organiser_name,
            COUNT(p.id) FILTER (WHERE p.status = 'confirmed') ::int AS confirmed_count
        FROM matches m 
        JOIN users u ON u.id = m.organiser_id
        LEFT JOIN participants p ON p.match_id =m.id
        WHERE m.kickoff_at > now()
        GROUP BY m.id, u.name
        ORDER BY m.kickoff_at ASC`
    );

    res.json({ matches: rows }); 
}); 

// Get one match 
// GET  api/matches/:id
router.get("/:id", async (req,res) => { 
    const { id } = req.params; 

    if (!/^\d+$/.test(id)) { 
        return res.status(404).json({ error: { message: "Match  not found"}});
    }

    const matchResult =  await pool.query( 
        `SELECT m.*, u.name  AS organiser_name
        FROM matches m 
        JOIN users u ON u.id = m.organiser_id
        WHERE m.id = $1`, 
        [id]
    );

    if(!matchResult.rows[0]) { 
        return res.status(404).json({error:{ message: "Match not found"}});
    }

    const participantResults = await pool.query( 
        `SELECT u.id AS user_id, u.name, p.status, p.joined_at
        FROM participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.match_id = $1
        ORDER BY  p.joined_at ASC, p.id ASC`, 
        [id]
    );

    res.json({
        match: matchResult.rows[0], 
        participants: participantResults.rows, 
    });
});

module.exports =  router; 
