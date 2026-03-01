#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(dirname "$0")"
DIRECTORY="$SCRIPT_DIR/../output/raw"
NEW_DIRECTORY="$SCRIPT_DIR/../output/tradingview"
mkdir -p "$NEW_DIRECTORY"

for FILE_PATH in "$DIRECTORY"/*; do
	if [ ! -f "$FILE_PATH" ]; then
		echo "No files found in $DIRECTORY"
		exit 1
	fi

	FILE_NAME=$(basename "$FILE_PATH")
	NEW_FILE_NAME="${FILE_NAME}.txt"

	cp "$FILE_PATH" "$NEW_DIRECTORY/$NEW_FILE_NAME"
	FILE_PATH="$NEW_DIRECTORY/$NEW_FILE_NAME"

	# Search for header row containing stock data (handles both NIFTY indices and F&O)
	SEARCH_PATTERN="NIFTY|Symbol"

	line_number=$(awk "/$SEARCH_PATTERN/{print NR; exit}" "$FILE_PATH")
	if [ -z "$line_number" ]; then
		line_number=15
	fi

	# Remove header rows, extract first column, clean up symbols, add NSE prefix
	# Combined sed operations for efficiency
	sed -i "" -e "1,${line_number}d" \
	          -e 's/"//g' \
	          -e 's/-/_/g' \
	          -e 's/&/_/g' "$FILE_PATH"
	
	awk -F ',' '{print "NSE:" $1}' "$FILE_PATH" > tempfile && mv tempfile "$FILE_PATH"

	# Convert newlines to commas and remove trailing comma
	tr '\n' ',' < "$FILE_PATH" | sed 's/,$//' > tempfile && mv tempfile "$FILE_PATH"
	
	echo "Converted: $FILE_NAME"
done

echo "All files converted successfully."