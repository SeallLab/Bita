import os
import requests

API_KEY=os.getenv("IEEE_API_KEY")
BASE_URL = "http://ieeexploreapi.ieee.org/api/v1/search/articles"

def query_ieee(keyword, max_records=5):
    params = {
        "apikey": API_KEY,
        "format": "json",
        "max_records": max_records,
        "start_record": 1,
        "sort_order": "desc",
        "sort_field": "publication_year",
        "abstract": "true",
        "querytext": keyword
    }
    response = requests.get(BASE_URL, params=params)
    print(f"{response.url} &  {response.text}")
    data = response.json()
    return data.get("articles", [])
