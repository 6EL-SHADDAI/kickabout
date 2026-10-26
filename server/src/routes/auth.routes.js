const express = require("express"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const pool = require("../db/pool");
const validate = require("../middleware/validate"); 

const router = express.Router(); 

// schemas 
const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"), 
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"), 
}); 

const loginSchema = z.object({ 
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(1,"Password is required"), 
});  

// Helper 
function signToken(user) { 
    return  jwt.sign({ sub: user.id}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}

// POST api/auth/register
router.post("/register", validate(registerSchema), async (req, res) => {
    const {name, email, password} = req.body;

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at`,
            [name, email, passwordHash]
        );

        const user = rows[0];
        res.status(201).json({user, token: signToken(user)}); 
    } catch (err) { 
        if (err.code === "23505") { 
            return res 
            .status(409)
            .json({error: {  message: "Email already registered"}});
        }
        throw err;
    }
       
});

// POST api/auth/login
router.post("/login", validate(loginSchema), async (req, res) => { 
    const { email, password} =  req.body; 

    const { rows} = await pool.query( 
        "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1", 
        [email]
    );

        const userRow = rows[0]; 
        const passwordOk = userRow
        ? await bcrypt.compare(password, userRow.password_hash)
        : false; 

        if (!passwordOk) { 
            return res 
            .status(401)
            .json({ error: {message: "Invalid email or password"}}); 
        }

        const user = { 
            id:  userRow.id, 
            name: userRow.name, 
            email: userRow.email, 
            created_at: userRow.created_at,
        };
        res.json({user, token: signToken(user)}); 
        }); 
        module.exports =  router; 

    
