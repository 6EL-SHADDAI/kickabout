1. Why a join table instead of storing player ids on the match?

Short answer: “Because a user can be in many matches and a match has many users. That’s a many-to-many relationship, and a relational database models it with a join table.”

The reasons behind it:

No lists inside a column. A column holding [4, 9, 12] can’t have foreign keys, can’t be queried cleanly, and breaks the idea that each field holds one value.
Each row is one fact. “User 9 is in match 3” is a single row. Joining and leaving become simple INSERT and DELETE statements.
The relationship has its own data. The row stores status (confirmed or waitlisted) and joined_at. That joined_at gives you the waitlist order, so the waitlist falls out of the design.
Queries stay easy. “Who’s in this match?” and “which matches am I in?” are both simple JOINs, and counting confirmed players is a COUNT.

Memory hook: One fact per row. The relationship needs a home, and the home is a table.

2. Why UNIQUE (match_id, user_id) in the database when my code could check for duplicates?

Short answer: “Because application code can have bugs and race conditions, and the database is the only thing that sees every request. A constraint guarantees the rule can never be broken, no matter what calls the database.”

The reasons behind it:

Race conditions. If a user double-clicks Join, two requests can both check “not in the match yet” and both insert. A code-level check can’t prevent that, because the checks happen before either insert. A unique constraint rejects the second insert.
More than one way in. Your API, a future script, a migration or someone typing SQL directly all hit the same table. Only the database sees all of them.
Defence in depth. The code check gives a friendly error message, and the constraint is the safety net underneath. You want both.
It’s cheap. Postgres enforces it with an index, so it doesn’t slow anything down noticeably.

Memory hook: Code checks are for good messages. Constraints are for guarantees


// Register and Login working 
1. How does a JWT work, and why can you read its payload without the secret?

“A JWT is a small token made of three parts: a header, a payload and a signature. When I log in, my server puts my user id and an expiry date in the payload and signs it with a secret only the server knows. The client sends the token back with each request, and the server checks the signature and the expiry. If anyone changed the payload, the signature wouldn’t match. The payload is only encoded, not encrypted, so anyone can read it on jwt.io without the secret. The secret doesn’t hide the data, it proves nobody tampered with it. That’s why I only put the user id in it and never anything sensitive.”

2. Why bcrypt instead of plain SHA-256?

“SHA-256 is built to be fast, so an attacker who steals the database could try billions of password guesses per second. bcrypt is slow on purpose, and I can raise the cost factor as computers get faster. It also adds a random salt to every password, so two users with the same password get different hashes. That stops attackers using precomputed tables of common password hashes. I never store the real password, and at login I compare the attempt against the stored hash.”

3. Why the same error message for a wrong email and a wrong password?

“If the endpoint said ‘email not found’ for one and ‘wrong password’ for the other, anyone could use the login form to check which emails have accounts. A vague ‘Invalid email or password’ for both gives an attacker nothing to work with. It’s a small detail that prevents account enumeration.”