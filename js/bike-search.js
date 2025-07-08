class BikeSearch {
    constructor() {
        // Google API key
        this.API_KEY = 'AIzaSyBoHxCzT5MxcfMwp0-SBxBR95yGYyxYf7E';
        
        // Spreadsheet ID from the URL
        this.SPREADSHEET_ID = '1MBOgylql47RC_7KScV4f_avVicEqPrBt5HoC3nMBiTE';
        
        // Storage keys
        this.STORAGE_KEY_PARAMS = 'bikeSearchParams';
        this.STORAGE_KEY_RESULTS = 'bikeSearchResults';
        
        // Sorting state
        this.sortColumn = 'totalDiff'; // Default sort by total difference
        this.sortDirection = 'asc';    // Default ascending order
        
        this.initializeSearch();
    }

    initializeSearch() {
        const searchButton = document.querySelector('.search-button');
        searchButton.addEventListener('click', () => this.searchBikes());

        const clearButton = document.querySelector('.clear-search-button');
        clearButton.addEventListener('click', () => this.clearSearch());

        // Add enter key support
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchBikes();
                }
            });
        });
        
        // Load bike data to populate style filter
        this.loadStyleOptions();
        
        // Load saved search parameters and results
        this.loadSavedSearch();
    }
    
    loadSavedSearch() {
        try {
            // Load saved parameters
            const savedParams = localStorage.getItem(this.STORAGE_KEY_PARAMS);
            if (savedParams) {
                const params = JSON.parse(savedParams);
                
                // Set input values
                if (params.reachTarget) document.getElementById('reachTarget').value = params.reachTarget;
                if (params.stackTarget) document.getElementById('stackTarget').value = params.stackTarget;
                if (params.reachRange) document.getElementById('reachRange').value = params.reachRange;
                if (params.stackRange) document.getElementById('stackRange').value = params.stackRange;
                
                // We'll set the style filter after options are loaded
                this.savedStyleFilter = params.styleFilter;
            }
            
            // Load saved results
            const savedResults = localStorage.getItem(this.STORAGE_KEY_RESULTS);
            if (savedResults) {
                const results = JSON.parse(savedResults);
                if (results.bikes && results.reachTarget && results.stackTarget) {
                    this.displayResults(results.bikes, results.reachTarget, results.stackTarget);
                }
            }
        } catch (error) {
            console.error('Error loading saved search:', error);
        }
    }
    
    saveSearchParams(params) {
        try {
            localStorage.setItem(this.STORAGE_KEY_PARAMS, JSON.stringify(params));
        } catch (error) {
            console.error('Error saving search parameters:', error);
        }
    }
    
    saveSearchResults(bikes, reachTarget, stackTarget) {
        try {
            const results = {
                bikes,
                reachTarget,
                stackTarget,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY_RESULTS, JSON.stringify(results));
        } catch (error) {
            console.error('Error saving search results:', error);
        }
    }

    async fetchBikeData() {
        // Update range to include all relevant columns (A through I for all bike data)
        const range = 'A1:I1000';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${range}?key=${this.API_KEY}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch bike data');
            }
            const data = await response.json();
            return this.processSheetData(data.values);
        } catch (error) {
            this.displayError('Error loading bike data: ' + error.message);
            return [];
        }
    }

    processSheetData(values) {
        // Skip header row and process data
        const headers = values[0];
        return values.slice(1).map(row => {
            const bike = {};
            headers.forEach((header, index) => {
                bike[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
            });
            return bike;
        });
    }

    async loadStyleOptions() {
        try {
            const bikes = await this.fetchBikeData();
            const styleSelect = document.getElementById('styleFilter');
            
            // Get unique styles
            const styles = [...new Set(bikes.map(bike => bike.style).filter(Boolean))].sort();
            
            // Add options to select
            styles.forEach(style => {
                const option = document.createElement('option');
                option.value = style;
                option.textContent = style;
                styleSelect.appendChild(option);
            });
            
            // Set saved style filter if available
            if (this.savedStyleFilter) {
                styleSelect.value = this.savedStyleFilter;
            }
        } catch (error) {
            console.error('Error loading style options:', error);
        }
    }

    async searchBikes() {
        const reachTarget = parseFloat(document.getElementById('reachTarget').value);
        const stackTarget = parseFloat(document.getElementById('stackTarget').value);
        const reachRange = parseFloat(document.getElementById('reachRange').value) || 10;
        const stackRange = parseFloat(document.getElementById('stackRange').value) || 10;
        const styleFilter = document.getElementById('styleFilter').value;

        if (!this.validateInputs(reachTarget, stackTarget, reachRange, stackRange)) {
            return;
        }
        
        // Save search parameters
        this.saveSearchParams({
            reachTarget,
            stackTarget,
            reachRange,
            stackRange,
            styleFilter
        });

        try {
            const bikes = await this.fetchBikeData();
            const matchingBikes = this.filterBikes(bikes, reachTarget, stackTarget, reachRange, stackRange, styleFilter);
            this.displayResults(matchingBikes, reachTarget, stackTarget);
            
            // Save search results
            this.saveSearchResults(matchingBikes, reachTarget, stackTarget);
        } catch (error) {
            this.displayError('Error searching bikes: ' + error.message);
        }
    }

    validateInputs(reach, stack, reachRange, stackRange) {
        if (isNaN(reach) || isNaN(stack)) {
            this.displayError('Please enter valid numbers for Reach and Stack');
            return false;
        }
        if (reach < 300 || reach > 500 || stack < 400 || stack > 700) {
            this.displayError('Please enter reasonable values for Reach (300-500) and Stack (400-700)');
            return false;
        }
        if (reachRange < 0 || stackRange < 0) {
            this.displayError('Range values must be positive');
            return false;
        }
        return true;
    }

    filterBikes(bikes, reachTarget, stackTarget, reachRange, stackRange, styleFilter) {
        return bikes
            .filter(bike => {
                const reach = parseFloat(bike.reach);
                const stack = parseFloat(bike.stack);
                const styleMatch = !styleFilter || bike.style === styleFilter;
                
                return (
                    Math.abs(reach - reachTarget) <= reachRange &&
                    Math.abs(stack - stackTarget) <= stackRange &&
                    styleMatch
                );
            })
            .map(bike => ({
                ...bike,
                reachDiff: parseFloat(bike.reach) - reachTarget,
                stackDiff: parseFloat(bike.stack) - stackTarget,
                totalDiff: Math.abs(parseFloat(bike.reach) - reachTarget) + 
                          Math.abs(parseFloat(bike.stack) - stackTarget)
            }))
            .sort((a, b) => a.totalDiff - b.totalDiff)
            .slice(0, 100); // Limit to top 100 matches
    }

    displayResults(bikes, reachTarget, stackTarget) {
        const resultsTable = document.getElementById('resultsTable');
        if (bikes.length === 0) {
            resultsTable.innerHTML = '<tr><td colspan="8">No matching bikes found</td></tr>';
            return;
        }

        // Sort bikes based on current sort settings
        const sortedBikes = this.sortBikes(bikes);

        const headers = `
            <thead>
                <tr>
                    <th class="sortable" data-sort="brand">Brand</th>
                    <th class="sortable" data-sort="model">Model</th>
                    <th class="sortable" data-sort="size">Size</th>
                    <th class="sortable" data-sort="style">Style</th>
                    <th class="sortable" data-sort="reach">Reach</th>
                    <th class="sortable" data-sort="stack">Stack</th>
                    <th class="sortable" data-sort="reachDiff">Δ Reach</th>
                    <th class="sortable" data-sort="stackDiff">Δ Stack</th>
                </tr>
            </thead>`;

        const rows = sortedBikes.map(bike => `
            <tr>
                <td>${this.escapeHtml(bike.brand)}</td>
                <td>${this.escapeHtml(bike.model)}</td>
                <td>${this.escapeHtml(bike.size)}</td>
                <td>${this.escapeHtml(bike.style || '')}</td>
                <td>${parseFloat(bike.reach).toFixed(1)}</td>
                <td>${parseFloat(bike.stack).toFixed(1)}</td>
                <td class="${bike.reachDiff > 0 ? 'diff-positive' : 'diff-negative'}">
                    ${bike.reachDiff > 0 ? '+' : ''}${bike.reachDiff.toFixed(1)}
                </td>
                <td class="${bike.stackDiff > 0 ? 'diff-positive' : 'diff-negative'}">
                    ${bike.stackDiff > 0 ? '+' : ''}${bike.stackDiff.toFixed(1)}
                </td>
            </tr>
        `).join('');

        resultsTable.innerHTML = headers + '<tbody>' + rows + '</tbody>';
        
        // Add event listeners to sortable headers
        this.addSortListeners();
    }
    
    sortBikes(bikes) {
        return [...bikes].sort((a, b) => {
            let valueA, valueB;
            
            // Handle different data types
            if (this.sortColumn === 'brand' || this.sortColumn === 'model' || 
                this.sortColumn === 'size' || this.sortColumn === 'style') {
                valueA = (a[this.sortColumn] || '').toLowerCase();
                valueB = (b[this.sortColumn] || '').toLowerCase();
            } else {
                valueA = parseFloat(a[this.sortColumn]) || 0;
                valueB = parseFloat(b[this.sortColumn]) || 0;
            }
            
            // Compare based on direction
            if (this.sortDirection === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    }
    
    addSortListeners() {
        const headers = document.querySelectorAll('#resultsTable th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');
                
                // If clicking the same column, toggle direction
                if (column === this.sortColumn) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    // New column, set as ascending
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }
                
                // Update UI to show sort direction
                this.updateSortIndicators(headers, header);
                
                // Re-display results with new sort
                const reachTarget = parseFloat(document.getElementById('reachTarget').value);
                const stackTarget = parseFloat(document.getElementById('stackTarget').value);
                
                // Get current results from table
                const savedResults = localStorage.getItem(this.STORAGE_KEY_RESULTS);
                if (savedResults) {
                    const results = JSON.parse(savedResults);
                    if (results.bikes) {
                        this.displayResults(results.bikes, results.reachTarget, results.stackTarget);
                    }
                }
            });
        });
    }
    
    updateSortIndicators(allHeaders, activeHeader) {
        // Remove indicators from all headers
        allHeaders.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add indicator to active header
        activeHeader.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }

    displayError(message) {
        const resultsTable = document.getElementById('resultsTable');
        resultsTable.innerHTML = `
            <tr>
                <td colspan="8" style="color: var(--error-color);">${this.escapeHtml(message)}</td>
            </tr>`;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    clearSearch() {
        // Clear input fields
        document.getElementById('reachTarget').value = '';
        document.getElementById('stackTarget').value = '';
        document.getElementById('reachRange').value = '';
        document.getElementById('stackRange').value = '';
        document.getElementById('styleFilter').value = '';
        
        // Clear results table
        const resultsTable = document.getElementById('resultsTable');
        resultsTable.innerHTML = `
            <tr>
                <td colspan="8">Enter target measurements and click Search</td>
            </tr>`;
        
        // Clear localStorage
        localStorage.removeItem(this.STORAGE_KEY_PARAMS);
        localStorage.removeItem(this.STORAGE_KEY_RESULTS);
    }
}

// Initialize the bike search when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BikeSearch();
}); 