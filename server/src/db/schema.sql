Create TABLE users ( 
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT  NULL,
    email      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matches (
    id             SERIAL PRIMARY KEY,
    organiser_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    title          TEXT NOT NULL,
    venue          Text NOT NULL,
    city           TEXT NOT NULL, 
    kickof_at      TIMESTAMPTZ NOT NULL, 
    max_players    INT NOT NULL CHECK (max_players BETWEEN 2 AND 30), 
    created_at     TIMESTAMPTZ NOT NULL DEFAULT  now()
); 

CREATE TABLE participants ( 
    id          SERIAL PRIMARY KEY, 
    match_id    INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE, 
    user_id     INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    status      TEXT NOT NULL CHECK (status IN ('confirmed','waitlisted')), 
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(), 
    UNIQUE (match_id, user_id)
)