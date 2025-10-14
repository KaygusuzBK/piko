#!/bin/bash

# Script to add DROP POLICY IF EXISTS before CREATE POLICY statements

for file in supabase/*.sql; do
    echo "Processing $file..."
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file
    awk '
    /^CREATE POLICY/ {
        # Extract policy name from CREATE POLICY statement
        policy_name = ""
        if (match($0, /"([^"]+)"/, arr)) {
            policy_name = arr[1]
        }
        
        # Extract table name
        table_name = ""
        if (match($0, /ON ([a-zA-Z_][a-zA-Z0-9_]*)/, arr)) {
            table_name = arr[1]
        }
        
        # Add DROP POLICY IF EXISTS before CREATE POLICY
        if (policy_name != "" && table_name != "") {
            print "DROP POLICY IF EXISTS \"" policy_name "\" ON " table_name ";"
        }
    }
    
    # Print the original line
    { print }
    ' "$file" > "$temp_file"
    
    # Replace original file with processed version
    mv "$temp_file" "$file"
done

echo "Done!"
