class HXHYCalculator {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Input fields for X/Y coordinates
        document.getElementById('handlebarX').addEventListener('input', () => this.calculate());
        document.getElementById('handlebarY').addEventListener('input', () => this.calculate());
        document.getElementById('headTubeAngle').addEventListener('input', () => this.calculate());
        document.getElementById('stemLength').addEventListener('input', () => this.calculate());
        document.getElementById('stemAngle').addEventListener('input', () => this.calculate());
        document.getElementById('spacerHeight').addEventListener('input', () => this.calculate());
    }

    calculate() {
        const handlebarX = parseFloat(document.getElementById('handlebarX').value) || 0;
        const handlebarY = parseFloat(document.getElementById('handlebarY').value) || 0;
        const headTubeAngle = parseFloat(document.getElementById('headTubeAngle').value) || 73;
        const stemLength = parseFloat(document.getElementById('stemLength').value) || 100;
        const stemAngle = parseFloat(document.getElementById('stemAngle').value) || -6;
        const spacerHeight = parseFloat(document.getElementById('spacerHeight').value) || 20;

        // Convert head tube angle to radians
        const htaRad = (180 - headTubeAngle) * Math.PI / 180;
        const stemRad = (90 - headTubeAngle + stemAngle) * Math.PI / 180;

        // Calculate stem center position
        const stemCenterX = (spacerHeight + 20) * Math.cos(htaRad); // 20mm is default stem height
        const stemCenterY = (spacerHeight + 20) * Math.sin(htaRad);

        // Calculate stem clamp position
        const clampX = stemLength * Math.cos(stemRad);
        const clampY = stemLength * Math.sin(stemRad);

        // Calculate frame reach and stack
        const frameReach = handlebarX - stemCenterX - clampX;
        const frameStack = handlebarY - stemCenterY - clampY;

        // Update results
        document.getElementById('frameReach').textContent = `${Math.round(frameReach)} mm`;
        document.getElementById('frameStack').textContent = `${Math.round(frameStack)} mm`;
    }
}

// Initialize calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HXHYCalculator();
}); 