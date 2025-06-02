-- SQLBook: Code
CREATE DATABASE IF NOT EXISTS fairness_db;

USE fairness_db;

CREATE TABLE IF NOT EXISTS messages (
    session_id TEXT,
    sender TEXT,
    message TEXT,
    timestamp TEXT
);

