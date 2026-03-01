#/bin/sh
set +x

PWD="$(dirname "$0")"
DIRECTORY="$PWD/../output/downloaded"
NEW_DIRECTORY="$PWD/../output/converted"
mkdir -p "$NEW_DIRECTORY"

for FILE_PATH in "$DIRECTORY"/*; do
	FILE_NAME=$(basename "$FILE_PATH")

	NEW_FILE_NAME="${FILE_NAME}.txt"

	cp $FILE_PATH $NEW_DIRECTORY/$NEW_FILE_NAME
	FILE_PATH=$NEW_DIRECTORY/$NEW_FILE_NAME

	SEARCH_STRING="NIFTY"

	line_number=$(awk "/$SEARCH_STRING/{print NR; exit}" $FILE_PATH)
	if [ -z "$line_number" ]; then
		line_number=15
	fi

	sed -i "" "1,${line_number}d" $FILE_PATH
	awk -F ',' '{print $1}' $FILE_PATH > tempfile && mv tempfile $FILE_PATH
	sed -i "" "s/\"//g" $FILE_PATH
	sed -i "" "s/-/_/g" $FILE_PATH
	sed -i "" "s/&/_/g" $FILE_PATH
	sed -i "" "s/^/NSE:/g" $FILE_PATH

	tr '\n' '\,' < $FILE_PATH > tempfile && mv tempfile $FILE_PATH
done