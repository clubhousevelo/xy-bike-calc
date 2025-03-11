#!/bin/bash

# Find all HTML files
for file in *.html; do
  echo "Updating CSP in $file with img-src directive"
  
  # Add img-src directive if it doesn't exist
  sed -i '' 's|style-src '"'"'self'"'"' '"'"'unsafe-inline'"'"';|style-src '"'"'self'"'"' '"'"'unsafe-inline'"'"'; img-src '"'"'self'"'"' https://www.google-analytics.com;|g' "$file"
done

echo "CSP img-src update complete!" 