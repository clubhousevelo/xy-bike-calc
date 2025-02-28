class HXHYCalculator {
    constructor() {
        this.handlebarX = document.getElementById('handlebarX');
        this.handlebarY = document.getElementById('handlebarY');
        this.headTubeAngle = document.getElementById('headTubeAngle');
        this.stemHeight = document.getElementById('stemHeight');
        this.stemLength = document.getElementById('stemLength');
        this.stemAngle = document.getElementById('stemAngle');
        this.spacerHeight = document.getElementById('spacerHeight');
        this.frameReach = document.getElementById('frameReach');
        this.frameStack = document.getElementById('frameStack');

        // Check if there's saved data and a valid session
        const savedData = localStorage.getItem('hxhyCalculatorData');
        const sessionStart = sessionStorage.getItem('calculatorSession');
        
        if (savedData && sessionStart) {
            const data = JSON.parse(savedData);
            // Only load data if it's from the current session
            if (data.sessionTimestamp === sessionStart) {
                this.loadSavedData();
            }
        } else if (!sessionStart) {
            // Only set a new session if there isn't one at all
            sessionStorage.setItem('calculatorSession', Date.now().toString());
        }

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const inputs = [
            this.handlebarX,
            this.handlebarY,
            this.headTubeAngle,
            this.stemHeight,
            this.stemLength,
            this.stemAngle,
            this.spacerHeight
        ];

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculate();
                this.saveData();
            });
        });
    }

    saveData() {
        const data = {
            sessionTimestamp: sessionStorage.getItem('calculatorSession'),
            handlebarX: this.handlebarX.value,
            handlebarY: this.handlebarY.value,
            headTubeAngle: this.headTubeAngle.value,
            stemHeight: this.stemHeight.value,
            stemLength: this.stemLength.value,
            stemAngle: this.stemAngle.value,
            spacerHeight: this.spacerHeight.value
        };
        localStorage.setItem('hxhyCalculatorData', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('hxhyCalculatorData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.handlebarX.value = data.handlebarX || '469';
            this.handlebarY.value = data.handlebarY || '618';
            this.headTubeAngle.value = data.headTubeAngle || '72.4';
            this.stemHeight.value = data.stemHeight || '40';
            this.stemLength.value = data.stemLength || '100';
            this.stemAngle.value = data.stemAngle || '-6';
            this.spacerHeight.value = data.spacerHeight || '28';
            this.calculate();
        }
    }

    calculate() {
        // Check if handlebar coordinates are empty
        if (!this.handlebarX.value || !this.handlebarY.value) {
            this.frameReach.textContent = '-- mm';
            this.frameStack.textContent = '-- mm';
            return;
        }

        // Get all input values
        const handlebarX = parseFloat(this.handlebarX.value);
        const handlebarY = parseFloat(this.handlebarY.value);
        const hta = parseFloat(this.headTubeAngle.value);
        const stemHeight = parseFloat(this.stemHeight.value);
        const stemLength = parseFloat(this.stemLength.value);
        const stemAngle = parseFloat(this.stemAngle.value);
        const spacerHeight = parseFloat(this.spacerHeight.value);

        // Check if any value is NaN
        if ([handlebarX, handlebarY, hta, stemLength, stemAngle, stemHeight, spacerHeight].some(isNaN)) {
            this.frameReach.textContent = '-- mm';
            this.frameStack.textContent = '-- mm';
            return;
        }

        // Convert angles to radians - matching Swift's calculations exactly
        const htaRad = (180 - hta) * Math.PI / 180;
        const stemRad = (90 - hta + stemAngle) * Math.PI / 180;

        // Calculate stem center position (where stem meets steerer)
        const stemCenterX = (spacerHeight + stemHeight/2) * Math.cos(htaRad);
        const stemCenterY = (spacerHeight + stemHeight/2) * Math.sin(htaRad);

        // Calculate stem clamp position
        const clampX = stemLength * Math.cos(stemRad);
        const clampY = stemLength * Math.sin(stemRad);

        // Calculate frame coordinates by subtracting stem and steerer vectors from handlebar position
        const frameReachValue = Math.round(handlebarX - (stemCenterX + clampX));
        const frameStackValue = Math.round(handlebarY - (stemCenterY + clampY));

        // Update display
        this.frameReach.textContent = `${frameReachValue} mm`;
        this.frameStack.textContent = `${frameStackValue} mm`;
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HXHYCalculator();
}); 