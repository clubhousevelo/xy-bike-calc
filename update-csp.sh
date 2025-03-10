#!/bin/bash

# Find all HTML files
for file in *.html; do
  # Skip already updated files
  if [ "$file" == "index.html" ] || [ "$file" == "login.html" ] || [ "$file" == "about.html" ]; then
    echo "Skipping already updated file: $file"
    continue
  fi
  
  echo "Updating CSP in $file"
  
  # Replace the CSP line with the updated one
  sed -i '' 's|Content-Security-Policy" content="default-src '"'"'self'"'"'; script-src '"'"'self'"'"' https://www.gstatic.com https://cdnjs.cloudflare.com https://apis.google.com '"'"'unsafe-inline'"'"'; style-src|Content-Security-Policy" content="default-src '"'"'self'"'"'; script-src '"'"'self'"'"' https://www.gstatic.com https://cdnjs.cloudflare.com https://apis.google.com https://www.googletagmanager.com '"'"'unsafe-inline'"'"'; style-src|g' "$file"
  
  # Add the additional connect-src domains if they don't exist
  sed -i '' 's|https://*.googleapis.com;|https://*.googleapis.com https://www.google-analytics.com https://analytics.google.com;|g' "$file"
done

echo "CSP update complete!" 