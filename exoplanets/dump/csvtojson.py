import pandas as pd
import json

# Attempt to load the CSV file with UTF-8 encoding
try:
    df = pd.read_csv("data/exoplanets_cartesian.csv", encoding="utf-8")
except UnicodeDecodeError:
    # If there's a decoding error, try ISO-8859-1 or another appropriate encoding
    df = pd.read_csv("data/exoplanets.csv", encoding="ISO-8859-1")

# Convert the dataframe to JSON, keeping all columns
data = df.to_dict(orient="records")

# Save the JSON to a file
with open("exoplanets.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)
