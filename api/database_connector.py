import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

#Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except psycopg2.Error as err:
        print(f"Database connection error: {err}")
        return None