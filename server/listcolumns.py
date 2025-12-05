import sqlite3

# Function to list columns of a table
def list_columns(database_path, table_name):
    # Connect to the SQLite database
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    # Query to get column information
    cursor.execute(f"PRAGMA table_info({table_name});")
    
    # Fetch all columns
    columns = cursor.fetchall()
    
    # Check if the table exists
    if not columns:
        print(f"Table '{table_name}' does not exist in the database.")
    else:
        print(f"Columns in table '{table_name}':")
        for column in columns:
            print(column[1])  # column[1] is the column name
    
    # Close the connection
    conn.close()

# Input: Path to your database and the table name you want to inspect
database_path = input("Enter the path to your SQLite database: ")
table_name = input("Enter the table name: ")

# Call the function
list_columns(database_path, table_name)