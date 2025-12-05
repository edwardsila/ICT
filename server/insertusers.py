import sqlite3

# Function to check if the table exists and has the correct columns
def check_table_columns(database_path, table_name):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    # Check if the table exists by querying its schema
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()

    # If the table doesn't exist, return False
    if not columns:
        print(f"Table '{table_name}' does not exist in the database.")
        conn.close()
        return False

    # Check if the table has the correct columns
    expected_columns = ['id', 'username', 'password', 'role']
    existing_columns = [column[1] for column in columns]  # column[1] is the column name

    if all(col in existing_columns for col in expected_columns):
        print(f"Columns in table '{table_name}':")
        for col in existing_columns:
            print(f"- {col}")
        conn.close()
        return True
    else:
        print(f"Table '{table_name}' does not have the expected columns.")
        conn.close()
        return False

# Function to create an admin user
def create_admin_user(database_path, table_name, username, password):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    # Hash the password (optional, if you want to hash passwords)
    password_hash = password  # You can add password hashing here like bcrypt

    try:
        # Insert the admin user into the users table
        cursor.execute(f'''INSERT INTO {table_name} (username, password, role)
                          VALUES (?, ?, ?)''', (username, password_hash, 1))
        conn.commit()
        print(f"Admin user '{username}' created successfully!")
    except sqlite3.IntegrityError as e:
        print(f"Error: {e}")
    finally:
        conn.close()

# Main function to check the table and create an admin user
def main():
    # Get the database path and table name from the user
    database_path = input("Enter the path to your SQLite database: ")
    table_name = input("Enter the table name: ")

    # Check if the table exists and has the correct columns
    if check_table_columns(database_path, table_name):
        # Get the admin username and password
        admin_username = input("Enter the username for the admin: ")
        admin_password = input("Enter the password for the admin: ")
        
        # Create the admin user
        create_admin_user(database_path, table_name, admin_username, admin_password)
    else:
        print(f"Cannot create admin user because the table '{table_name}' is not valid.")

# Run the main function
if __name__ == "__main__":
    main()