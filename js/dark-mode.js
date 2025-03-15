document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const mobileDarkModeToggle = document.getElementById('mobileDarkModeToggle');
    const toggleIcon = darkModeToggle.querySelector('.toggle-icon');
    const toggleText = darkModeToggle.querySelector('.toggle-text');
    const mobileToggleIcon = mobileDarkModeToggle.querySelector('.toggle-icon');
    const mobileToggleText = mobileDarkModeToggle.querySelector('.toggle-text');

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateToggleButtons(savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateToggleButtons('dark');
    }

    // Toggle theme when desktop button is clicked
    darkModeToggle.addEventListener('click', toggleTheme);
    
    // Toggle theme when mobile button is clicked
    mobileDarkModeToggle.addEventListener('click', toggleTheme);

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleButtons(newTheme);
        
        // Redraw the stem visualization to reflect the new theme
        if (typeof drawRealisticStemVisualization === 'function') {
            drawRealisticStemVisualization();
        }
    }

    // Update button appearance based on current theme
    function updateToggleButtons(theme) {
        if (theme === 'dark') {
            toggleIcon.textContent = '🌙';
            toggleText.textContent = 'Dark Mode';
            mobileToggleIcon.textContent = '🌙';
            mobileToggleText.textContent = 'Dark Mode';
        } else {
            toggleIcon.textContent = '☀️';
            toggleText.textContent = 'Light Mode';
            mobileToggleIcon.textContent = '☀️';
            mobileToggleText.textContent = 'Light Mode';
        }
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateToggleButtons(newTheme);
            
            // Redraw the stem visualization to reflect the new theme
            if (typeof drawRealisticStemVisualization === 'function') {
                drawRealisticStemVisualization();
            }
        }
    });
}); 