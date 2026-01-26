#!/bin/bash

# Define the filename
FILE="example.txt"

# Run the copilot command and redirect the output to the file
# The '>' operator creates the file or overwrites it if it already exists
copilot --model gpt-4.1 -i "Hi" > "$FILE"

# Provide feedback to the terminal
if [ $? -eq 0 ]; then
    echo "Success! The output has been saved to $FILE."
else
    echo "Something went wrong with the copilot command."
fi