import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

load_dotenv()

class MongoSingleton:
    _client: MongoClient = None
    _db = None

    @classmethod
    def get_instance(cls):
        """Returns a singleton MongoDB database instance."""
        if cls._client is None:
            try:
                mongo_uri = os.getenv("MONGO_URI")

                if not mongo_uri:
                    raise ValueError("MONGO_URI is missing from environment variables.")

                cls._client = MongoClient(mongo_uri)

                db_name = os.getenv("MONGO_DB_NAME", "bita-cluster")
                cls._db = cls._client[db_name]

            except ConnectionFailure as e:
                print(f"MongoDB connection failed: {e}")
                cls._client = None
                cls._db = None

        return cls._db

def get_db_connection():
    return MongoSingleton.get_instance()