import os
from dotenv import load_dotenv
import mysql.connector

#Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

#Test database connection
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=int(os.getenv("DB_PORT", 3306)),
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None