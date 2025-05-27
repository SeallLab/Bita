-- SQLBook: Code
CREATE DATABASE IF NOT EXISTS fairness_db;

USE fairness_db;

CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    role TEXT,  -- 'user' or 'bot'
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

