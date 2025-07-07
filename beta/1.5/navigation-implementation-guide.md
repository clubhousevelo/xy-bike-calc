# Modular Navigation Implementation Guide

This guide explains how to implement the modular navigation system across all HTML files in the XY Bike Calculator website.

## Overview

The modular navigation system allows you to:
- Maintain navigation menus in a single place (the `navigation.js` file)
- Update navigation elements across all pages at once
- Automatically highlight the current page in the navigation

## Steps to Update an HTML File

Follow these steps for each HTML file that needs to use the modular navigation:

1. **Keep the navigation containers, but empty them:**
   Replace the content inside `<nav class="mobile-nav">` and `<nav class="main-nav">` with comments indicating that navigation will be inserted by JavaScript.

   ```html
   <nav class="mobile-nav">
       <!-- Navigation will be inserted by navigation.js -->
   </nav>

   <nav class="main-nav">
       <!-- Navigation will be inserted by navigation.js -->
   </nav>
   ```

2. **Add the navigation.js script:**
   Include the `navigation.js` script after the mobile-menu.js script in your HTML files:

   ```html
   <script src="js/version.js"></script>
   <script src="js/mobile-menu.js"></script>
   <script src="js/navigation.js"></script>
   <script src="js/calculator-header.js"></script>
   <script src="js/firebase-auth.js"></script>
   ```

## Template File

Use the provided `navigation-template.html` file as a reference for how to structure your HTML files with the modular navigation system.

## Keeping Navigation in Sync Across Tiers

If you have different versions of your site (free, basic, pro), you should:

1. Copy `navigation.js` to each tier's `js` directory
2. When you need to update the navigation, edit all copies of `navigation.js` to ensure consistency

## How to Update the Navigation Menu

When you need to add, edit, or remove items from the navigation menu:

1. Open `js/navigation.js`
2. Locate the `createMobileNavigation()` and `createMainNavigation()` functions
3. Edit the template strings to update the navigation structure
4. Save the file and copy it to each tier's `js` directory if necessary

Example of adding a new menu item:

```javascript
function createMobileNavigation() {
    return `
        <ul>
            <li><a href="index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>X/Y Position Calculator</a></li>
            <li><a href="hxhy-frame-calculator.html" ${currentPage === 'hxhy-frame-calculator.html' ? 'class="active"' : ''}>HX/HY to Frame Calculator</a></li>
            <li><a href="stem-calculator.html" ${currentPage === 'stem-calculator.html' ? 'class="active"' : ''}>Stem Calculator</a></li>
            <li><a href="bike-search.html" ${currentPage === 'bike-search.html' ? 'class="active"' : ''}>Bike Search</a></li>
            <!-- New menu item -->
            <li><a href="new-feature.html" ${currentPage === 'new-feature.html' ? 'class="active"' : ''}>New Feature</a></li>
        </ul>
        <!-- Rest of the navigation HTML... -->
    `;
}
```

Remember to make the same changes to both the mobile and main navigation functions.

## Troubleshooting

- **Navigation doesn't appear**: Check that you've included the `navigation.js` script and that the script path is correct.
- **Event listeners not working**: Make sure the script order is correct, with dependencies loaded before `navigation.js`.
- **Active page not highlighted**: Verify that the page filenames match what's expected in the `currentPage` variable in `navigation.js`.

## Additional Customization

You can extend the `navigation.js` file to support other customizations, such as:

- Tier-specific navigation items
- Dynamic navigation based on user role
- Additional menu sections or submenus

Just update the template strings and the related event handling functions as needed. 