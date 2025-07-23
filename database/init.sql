-- SQLBook: Code
CREATE DATABASE IF NOT EXISTS fairness_db;

USE fairness_db;

CREATE TABLE IF NOT EXISTS messages (
    session_id VARCHAR(255),
    sender TEXT,
    message TEXT,
    timestamp TEXT
);

CREATE TABLE IF NOT EXISTS system_details (
    session_id VARCHAR(255) PRIMARY KEY,
    system_details TEXT
);

