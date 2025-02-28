class BikeSearch {
    constructor() {
        // Google API key
        this.API_KEY = 'AIzaSyBoHxCzT5MxcfMwp0-SBxBR95yGYyxYf7E';
        
        // Spreadsheet ID from the URL
        this.SPREADSHEET_ID = '1MBOgylql47RC_7KScV4f_avVicEqPrBt5HoC3nMBiTE';
        
        this.initializeSearch();
    }

    initializeSearch() {
        const searchButton = document.querySelector('.search-button');
        searchButton.addEventListener('click', () => this.searchBikes());

        // Add enter key support
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchBikes();
                }
            });
        });
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

    async searchBikes() {
        const reachTarget = parseFloat(document.getElementById('reachTarget').value);
        const stackTarget = parseFloat(document.getElementById('stackTarget').value);
        const reachRange = parseFloat(document.getElementById('reachRange').value) || 10;
        const stackRange = parseFloat(document.getElementById('stackRange').value) || 10;

        if (!this.validateInputs(reachTarget, stackTarget, reachRange, stackRange)) {
            return;
        }

        try {
            const bikes = await this.fetchBikeData();
            const matchingBikes = this.filterBikes(bikes, reachTarget, stackTarget, reachRange, stackRange);
            this.displayResults(matchingBikes, reachTarget, stackTarget);
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

    filterBikes(bikes, reachTarget, stackTarget, reachRange, stackRange) {
        return bikes
            .filter(bike => {
                const reach = parseFloat(bike.reach);
                const stack = parseFloat(bike.stack);
                return (
                    Math.abs(reach - reachTarget) <= reachRange &&
                    Math.abs(stack - stackTarget) <= stackRange
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
            resultsTable.innerHTML = '<tr><td colspan="7">No matching bikes found</td></tr>';
            return;
        }

        const headers = `
            <thead>
                <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Size</th>
                    <th>Reach</th>
                    <th>Stack</th>
                    <th>Δ Reach</th>
                    <th>Δ Stack</th>
                </tr>
            </thead>`;

        const rows = bikes.map(bike => `
            <tr>
                <td>${this.escapeHtml(bike.brand)}</td>
                <td>${this.escapeHtml(bike.model)}</td>
                <td>${this.escapeHtml(bike.size)}</td>
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
    }

    displayError(message) {
        const resultsTable = document.getElementById('resultsTable');
        resultsTable.innerHTML = `
            <tr>
                <td colspan="7" style="color: var(--error-color);">${this.escapeHtml(message)}</td>
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
}

// Initialize the bike search when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BikeSearch();
}); 
