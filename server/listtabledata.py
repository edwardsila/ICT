import sqlite3
import json

# Function to fetch all rows from a table and return the result as JSON
def fetch_table_data(database_path, table_name):
    # Connect to the SQLite database
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    # SQL query to fetch all rows from the specified table
    query = f"SELECT * FROM {table_name}"
    
    # Execute the query and fetch all rows
    cursor.execute(query)
    rows = cursor.fetchall()
    
    # Get column names from the table
    column_names = [description[0] for description in cursor.description]
    
    # Convert the data into a list of dictionaries (for JSON conversion)
    data = []
    for row in rows:
        row_dict = dict(zip(column_names, row))
        data.append(row_dict)
    
    # Convert the list of dictionaries into JSON format
    json_data = json.dumps(data, indent=4)
    
    # Close the connection
    conn.close()
    
    return json_data

# Input: Path to your SQLite database and table name
database_path = input("Enter the path to your SQLite database: ")
table_name = input("Enter the name of the table you want to fetch data from: ")

# Fetch data and print it in JSON format
json_result = fetch_table_data(database_path, table_name)
print(json_result)