import os
from dotenv import load_dotenv
from supabase import create_client, Client

#Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

#Singleton database access for Supabase
class SupabaseSingleton:
    _instance: Client = None

    @classmethod
    def get_instance(cls) -> Client:
        """Returns a singleton instance of the Supabase client."""
        if cls._instance is None:
            try:
                if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                    raise ValueError("Supabase URL or Service Key is missing.")

                cls._instance = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            except Exception as e:
                cls._instance = None
        return cls._instance

def get_db_connection() -> Client:
    """Returns the singleton instance of the Supabase client."""
    return SupabaseSingleton.get_instance()