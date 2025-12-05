import sqlite3

# Connect to your SQLite database
conn = sqlite3.connect('ict_inventory.db')
cursor = conn.cursor()

# List all tables in the database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print(f"tables {tables}")

# Loop through the tables and delete data from them except the 'user' table
#for table in tables:
    #table_name = table[0]
   # if table_name != 'user':
        # Execute delete command for the table
      #  cursor.execute(f"DELETE FROM {table_name};")
      #  print(f"Deleted all rows from {table_name}")

# Commit changes and close the connection
#conn.commit()
#conn.close()