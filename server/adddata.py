import sqlite3
import pandas as pd

# Function to insert data from all sheets in Excel into the inventory table
def insert_inventory_data(database_path, excel_file):
    # Connect to the SQLite database
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    # Read all sheets in the Excel file
    df_sheets = pd.read_excel(excel_file, sheet_name=None)  # This loads all sheets into a dictionary
    
    # Iterate through all sheets in the Excel file
    for sheet_name, df in df_sheets.items():
        print(f"Inserting data from sheet: {sheet_name}")
        
        # Add the missing columns with default values (set to NULL or None)
        df['os_info'] = None
        df['replacement_of'] = None
        df['received_at'] = None
        df['replaced_by'] = None
        
        # Prepare the columns mapping between Excel and inventory table
        column_mapping = {
            'Asset No': 'asset_no',  # Now including 'asset_no' from the sheet
            'Asset Type': 'asset_type',
            'Serial No': 'serial_no',
            'Manufacturer': 'manufacturer',
            'Model': 'model',
            'Version': 'version',
            'Status': 'status',
            'Department': 'department'
        }

        # Insert data into the inventory table
        for _, row in df.iterrows():
            # Map the Excel columns to the inventory table columns
            values = (
                row['Asset No'], row['Asset Type'], row['Serial No'], row['Manufacturer'],
                row['Model'], row['Version'], row['Status'], row['Department'],
                row['os_info'], row['replacement_of'], row['received_at'], row['replaced_by']
            )
            
            # Construct the insert query, including asset_no from the sheet
            insert_query = '''INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, status, department, os_info, replacement_of, received_at, replaced_by)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'''
            
            # Execute the insert query
            cursor.execute(insert_query, values)

        # Commit changes after each sheet (optional: you can move this outside the loop to commit after all sheets)
        conn.commit()
    
    # Close the connection
    conn.close()
    print("Data insertion completed.")

# Input: Path to your SQLite database and Excel file
database_path = input("Enter the path to your SQLite database: ")
excel_file = input("Enter the path to your Excel file: ")

# Call the function to insert data
insert_inventory_data(database_path, excel_file)