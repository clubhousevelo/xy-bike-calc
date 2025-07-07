// Navigation.js - Handles loading and injection of navigation menus
// This makes the navigation menu modular and maintainable from a single source

document.addEventListener('DOMContentLoaded', function() {
    // Get the current page URL to highlight the active menu item
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Load the navigation menu content
    loadNavigation();
    
    // Function to load navigation menu
    function loadNavigation() {
        // Define the navigation structure - this is the single source of truth for your menu
        const mobileNavHTML = createMobileNavigation();
        const mainNavHTML = createMainNavigation();
        
        // Insert the navigation HTML into the page
        const mobileNavContainer = document.querySelector('.mobile-nav');
        const mainNavContainer = document.querySelector('.main-nav');
        
        if (mobileNavContainer) {
            mobileNavContainer.innerHTML = mobileNavHTML;
        }
        
        if (mainNavContainer) {
            mainNavContainer.innerHTML = mainNavHTML;
        }
        
        // Setup event listeners for the newly injected elements
        setupNavigationEvents();
    }
    
    // Function to create mobile navigation HTML
    function createMobileNavigation() {
        return `
            <ul>
                <li><a href="index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>X/Y Position Calculator</a></li>
                <li><a href="hxhy-frame-calculator.html" ${currentPage === 'hxhy-frame-calculator.html' ? 'class="active"' : ''}>HX/HY to Frame Calculator</a></li>
                <li><a href="stem-calculator.html" ${currentPage === 'stem-calculator.html' ? 'class="active"' : ''}>Stem Calculator</a></li>
                <li><a href="bike-search.html" ${currentPage === 'bike-search.html' ? 'class="active"' : ''}>Bike Search</a></li>
            </ul>
            <div class="flex-spacer"></div>
            <div class="nav-item">
                <a href="about.html" ${currentPage === 'about.html' ? 'class="active"' : ''}>About</a>
            </div>
            <div class="nav-item-guide">
                <a href="guide.html" ${currentPage === 'guide.html' ? 'class="active"' : ''}>Guide</a>
            </div>
            <div class="non-auth-dependent login-container">
                <button class="login-button" onclick="window.location.href='login.html'">Login</button>
            </div>
            <div class="auth-dependent auth-container">
                <div class="user-container">
                    <span class="user-display"></span>
                    <button id="logout-button-mobile" class="logout-button">Logout</button>
                </div>
            </div>
            <div class="theme-toggle">
                <button id="mobileDarkModeToggle" class="dark-mode-toggle" onclick="toggleTheme()">
                    <span class="toggle-icon">☀️</span>
                    <span class="toggle-text">Light Mode</span>
                </button>
            </div>
            <div class="footer-links">
                <a href="tos.html" style="margin-bottom: -10px;">Terms of Service</a>
                <a href="privacy-policy.html">Privacy Policy</a>
                <div class="version">
                    <a href="changelog.html">&nbsp;</a>
                </div>
            </div>
        `;
    }
    
    // Function to create main navigation HTML
    function createMainNavigation() {
        return `
            <div class="nav-header">
                <h2>XY Bike Calc</h2>
            </div>
            <ul>
                <li><a href="../xy-position-calculator" ${currentPage === '../xy-position-calculator' ? 'class="active"' : ''}>X/Y Position Calculator</a></li>
                <li><a href="../hxhy-frame-calculator" ${currentPage === '../hxhy-calculator' ? 'class="active"' : ''}>HX/HY to Frame Calculator</a></li>
                <li><a href="../stem-calculator" ${currentPage === '../stem-calculator' ? 'class="active"' : ''}>Stem Calculator</a></li>
                <li><a href="../bike-search" ${currentPage === '../bike-search' ? 'class="active"' : ''}>Bike Search</a></li>
            </ul>
            <div class="flex-spacer"></div>
            <div class="nav-item">
                <a href="../about.html" ${currentPage === 'about.html' ? 'class="active"' : ''}>About</a>
            </div>
            <div class="nav-item-guide">
                <a href="../guide.html" ${currentPage === 'guide.html' ? 'class="active"' : ''}>Guide</a>
            </div>
            <div class="non-auth-dependent login-container">
                <button class="login-button" onclick="window.location.href='../login.html'">Login</button>
            </div>
            <div class="auth-dependent auth-container">
                <div class="user-container">
                    <span class="user-display"></span>
                    <button id="logout-button" class="logout-button">Logout</button>
                </div>
            </div>
            <div class="theme-toggle">
                <button id="darkModeToggle" class="dark-mode-toggle" onclick="toggleTheme()">
                    <span class="toggle-icon">☀️</span>
                    <span class="toggle-text">Light Mode</span>
                </button>
            </div>
            <div class="footer-links">
                <a href="../tos.html" style="margin-bottom: -10px;">Terms of Service</a>
                <a href="../privacy-policy.html">Privacy Policy</a>
                <div class="version">
                    <a href="../changelog.html">&nbsp;</a>
                </div>
            </div>
        `;
    }
    
    // Set up event listeners for navigation elements
    function setupNavigationEvents() {
        // Set up mobile menu button
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', function() {
                document.querySelector('.mobile-nav').classList.toggle('active');
                this.classList.toggle('active');
            });
        }
        
        // Set up logout buttons - both desktop and mobile
        const logoutButtons = document.querySelectorAll('#logout-button, #logout-button-mobile');
        logoutButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (typeof handleLogout === 'function') {
                    handleLogout();
                } else {
                    console.warn('handleLogout function not found. Make sure firebase-auth.js is loaded before navigation.js');
                }
            });
        });
        
        // Set up dark mode toggle functionality
        const darkModeButtons = document.querySelectorAll('#darkModeToggle, #mobileDarkModeToggle');
        darkModeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                if (typeof toggleTheme === 'function') {
                    toggleTheme();
                } else {
                    console.warn('toggleTheme function not found. Make sure dark-mode.js is loaded before navigation.js');
                }
            });
            
            // Update button appearance based on current theme
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const icon = btn.querySelector('.toggle-icon');
            const text = btn.querySelector('.toggle-text');
            
            if (icon) icon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
            if (text) text.textContent = currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
        });
        
        // Setup profile link in navigation
        const userDisplayElements = document.querySelectorAll('.user-display');
        userDisplayElements.forEach(el => {
            el.addEventListener('click', function() {
                window.location.href = 'profile.html';
            });
            el.style.cursor = 'pointer';
        });
    }
}); 
