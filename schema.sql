CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_code VARCHAR(32) NOT NULL UNIQUE,
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    pet_species VARCHAR(12) CHECK (pet_species IN ('dog', 'cat', 'hamster', 'squirrel')),
    equipped_item VARCHAR(24),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safe to rerun on databases created before pets were introduced.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS pet_species VARCHAR(12);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS equipped_item VARCHAR(24);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    room_id BIGINT REFERENCES rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_room CHECK ((role = 'admin' AND room_id IS NULL) OR (role = 'user' AND room_id IS NOT NULL)),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

CREATE TABLE IF NOT EXISTS questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question TEXT NOT NULL CHECK (char_length(question) BETWEEN 1 AND 1000),
    order_no INTEGER NOT NULL CHECK (order_no > 0)
);
CREATE INDEX IF NOT EXISTS questions_order_idx ON questions(order_no, id);

CREATE TABLE IF NOT EXISTS answers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    answer TEXT NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (question_id, user_id)
);
CREATE INDEX IF NOT EXISTS answers_room_question_idx ON answers(room_id, question_id);

CREATE TABLE IF NOT EXISTS memories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memories_room_date_idx ON memories(room_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pet_inventory (
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_id VARCHAR(24) NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, item_id)
);
