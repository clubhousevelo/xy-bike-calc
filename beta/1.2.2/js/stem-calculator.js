// Define default values for stems
const DEFAULT_VALUES = {
    headTubeAngle: 73.0,
    stemHeight: 40,
    stemLength: 100,
    stemAngle: -6,
    spacerHeight: 20
};

let stemCount = 1; // Start with one stem
let baseX = 0;
let baseY = 0;

function calculateStemDimensions(stemId) {
    const id = stemId || 0;
    
    // Get input values
    const headTubeAngle = parseFloat(document.getElementById(`headTubeAngle-${id}`).value);
    const stemHeight = parseFloat(document.getElementById(`stemHeight-${id}`).value);
    const stemLength = parseFloat(document.getElementById(`stemLength-${id}`).value);
    const stemAngle = parseFloat(document.getElementById(`stemAngle-${id}`).value);
    const spacerHeight = parseFloat(document.getElementById(`spacerHeight-${id}`).value);

    // Convert angles to radians
    const htaRad = (180 - headTubeAngle) * Math.PI / 180;
    const stemRad = (90 - headTubeAngle + stemAngle) * Math.PI / 180;

    // Calculate stem center position
    const stemCenterX = (spacerHeight + stemHeight/2) * Math.cos(htaRad);
    const stemCenterY = (spacerHeight + stemHeight/2) * Math.sin(htaRad);

    // Calculate clamp position
    const clampX = stemLength * Math.cos(stemRad);
    const clampY = stemLength * Math.sin(stemRad);

    // Calculate total X and Y positions
    const totalX = stemCenterX + clampX;
    const totalY = stemCenterY + clampY;
    
    // Use rounded values for calculating differences
    const roundedTotalX = Math.round(totalX);
    const roundedTotalY = Math.round(totalY);
    const roundedBaseX = Math.round(baseX);
    const roundedBaseY = Math.round(baseY);
    
    // Calculate differences using rounded values
    const diffXInitial = roundedTotalX - roundedBaseX;
    const diffYInitial = roundedTotalY - roundedBaseY;
    
    // Create descriptive text for X (Run)
    let diffXText = '';
    if (diffXInitial > 0 && diffXInitial !== 0) {
        diffXText = `+${diffXInitial}mm longer →`;
    } else if (diffXInitial < 0 && diffXInitial !== 0) {
        diffXText = `${diffXInitial}mm shorter ←`;
    }
    
    // Create descriptive text for Y (Rise)
    let diffYText = '';
    if (diffYInitial > 0 && diffYInitial !== 0) {
        diffYText = `+${diffYInitial}mm higher ↑`;
    } else if (diffYInitial < 0 && diffYInitial !== 0) {
        diffYText = `${diffYInitial}mm lower ↓`;
    }
    
    // Update results
    document.getElementById(`effectiveReach-${id}`).innerHTML = 
        `Run (X): ${totalX.toFixed(0)}mm${id === 0 || !diffXText ? '' : 
        `<br><span class="diff-text ${diffXInitial > 0 ? 'negative' : 'positive'}">${diffXText}</span>`}`;
    document.getElementById(`effectiveStack-${id}`).innerHTML = 
        `Rise (Y): ${totalY.toFixed(0)}mm${id === 0 || !diffYText ? '' : 
        `<br><span class="diff-text ${diffYInitial > 0 ? 'positive' : 'negative'}">${diffYText}</span>`}`;
    
    // If this is the first stem, store its values as the base for comparison
    if (id === 0) {
        baseX = totalX;
        baseY = totalY;
        
        // Recalculate all other stems to update their differences
        for (let i = 1; i < stemCount; i++) {
            if (document.getElementById(`headTubeAngle-${i}`)) {
                calculateStemDimensions(i);
                highlightDifferences(i); // Highlight differences after recalculation
            }
        }
    } 
    // For other stems, show the difference from the first stem
    else {
        // Use rounded values for calculating differences
        const roundedTotalX = Math.round(totalX);
        const roundedTotalY = Math.round(totalY);
        const roundedBaseX = Math.round(baseX);
        const roundedBaseY = Math.round(baseY);
        
        // Calculate differences using rounded values
        const diffX = roundedTotalX - roundedBaseX;
        const diffY = roundedTotalY - roundedBaseY;
        
        // Create descriptive text for X (Run)
        let diffXText = '';
        if (diffX > 0 && diffX !== 0) {
            diffXText = `+${diffX}mm longer →`;
        } else if (diffX < 0 && diffX !== 0) {
            diffXText = `${diffX}mm shorter ←`;
        }
        
        // Create descriptive text for Y (Rise)
        let diffYText = '';
        if (diffY > 0 && diffY !== 0) {
            diffYText = `+${diffY}mm higher ↑`;
        } else if (diffY < 0 && diffY !== 0) {
            diffYText = `${diffY}mm lower ↓`;
        }
        
        document.getElementById(`effectiveReach-${id}`).innerHTML = 
            `Run (X): ${totalX.toFixed(0)}mm${!diffXText ? '' : 
            `<br><span class="diff-text ${diffX > 0 ? 'negative' : 'positive'}">${diffXText}</span>`}`;
        document.getElementById(`effectiveStack-${id}`).innerHTML = 
            `Rise (Y): ${totalY.toFixed(0)}mm${!diffYText ? '' : 
            `<br><span class="diff-text ${diffY > 0 ? 'positive' : 'negative'}">${diffYText}</span>`}`;
        
        // Highlight differences after calculation
        highlightDifferences(id);
    }
    
    return { x: totalX, y: totalY };
}

// New function to highlight differences between stems
function highlightDifferences(stemId) {
    if (stemId === 0) return; // Don't highlight the first stem
    
    // Get values from the first stem (reference)
    const refHeadTubeAngle = parseFloat(document.getElementById('headTubeAngle-0').value);
    const refStemHeight = parseFloat(document.getElementById('stemHeight-0').value);
    const refStemLength = parseFloat(document.getElementById('stemLength-0').value);
    const refStemAngle = parseFloat(document.getElementById('stemAngle-0').value);
    const refSpacerHeight = parseFloat(document.getElementById('spacerHeight-0').value);
    
    // Get values from the current stem
    const headTubeAngle = parseFloat(document.getElementById(`headTubeAngle-${stemId}`).value);
    const stemHeight = parseFloat(document.getElementById(`stemHeight-${stemId}`).value);
    const stemLength = parseFloat(document.getElementById(`stemLength-${stemId}`).value);
    const stemAngle = parseFloat(document.getElementById(`stemAngle-${stemId}`).value);
    const spacerHeight = parseFloat(document.getElementById(`spacerHeight-${stemId}`).value);
    
    // Get the input fields for the current stem
    const headTubeAngleField = document.getElementById(`headTubeAngle-${stemId}`).parentElement;
    const stemHeightField = document.getElementById(`stemHeight-${stemId}`).parentElement;
    const stemLengthField = document.getElementById(`stemLength-${stemId}`).parentElement;
    const stemAngleField = document.getElementById(`stemAngle-${stemId}`).parentElement;
    const spacerHeightField = document.getElementById(`spacerHeight-${stemId}`).parentElement;
    
    // Remove existing highlight classes
    headTubeAngleField.classList.remove('highlight-different');
    stemHeightField.classList.remove('highlight-different');
    stemLengthField.classList.remove('highlight-different');
    stemAngleField.classList.remove('highlight-different');
    spacerHeightField.classList.remove('highlight-different');
    
    // Compare values and highlight differences
    if (headTubeAngle !== refHeadTubeAngle) {
        headTubeAngleField.classList.add('highlight-different');
    }
    
    if (stemHeight !== refStemHeight) {
        stemHeightField.classList.add('highlight-different');
    }
    
    if (stemLength !== refStemLength) {
        stemLengthField.classList.add('highlight-different');
    }
    
    if (stemAngle !== refStemAngle) {
        stemAngleField.classList.add('highlight-different');
    }
    
    if (spacerHeight !== refSpacerHeight) {
        spacerHeightField.classList.add('highlight-different');
    }
}

function saveStemData() {
    const stems = [];
    const stemBoxes = document.querySelectorAll('.stem-box');
    
    stemBoxes.forEach((box, index) => {
        const stemId = parseInt(box.dataset.stemId.split('-')[1]);
        const data = {
            headTubeAngle: parseFloat(document.getElementById(`headTubeAngle-${stemId}`).value),
            stemHeight: parseFloat(document.getElementById(`stemHeight-${stemId}`).value),
            stemLength: parseFloat(document.getElementById(`stemLength-${stemId}`).value),
            stemAngle: parseFloat(document.getElementById(`stemAngle-${stemId}`).value),
            spacerHeight: parseFloat(document.getElementById(`spacerHeight-${stemId}`).value)
        };
        stems.push(data);
    });
    
    localStorage.setItem('stemCalculatorData', JSON.stringify(stems));
}

function loadStemData() {
    const savedData = localStorage.getItem('stemCalculatorData');
    if (!savedData) return;
    
    const stems = JSON.parse(savedData);
    
    // Remove all existing stems except the first one
    const stemBoxes = document.querySelectorAll('.stem-box');
    stemBoxes.forEach((box, index) => {
        if (index > 0) box.remove();
    });
    
    // Update first stem
    if (stems.length > 0) {
        const firstStem = stems[0];
        document.getElementById('headTubeAngle-0').value = firstStem.headTubeAngle;
        document.getElementById('stemHeight-0').value = firstStem.stemHeight;
        document.getElementById('stemLength-0').value = firstStem.stemLength;
        document.getElementById('stemAngle-0').value = firstStem.stemAngle;
        document.getElementById('spacerHeight-0').value = firstStem.spacerHeight;
    }
    
    // Add additional stems
    for (let i = 1; i < stems.length; i++) {
        addNewStem(stems[i]);
    }
    
    // If there's no Stem 2, add it with default values
    if (stems.length === 1) {
        addNewStem();
    }
    
    // Recalculate all stems
    calculateStemDimensions(0);
    
    // Apply highlighting to all stems
    const updatedStemBoxes = document.querySelectorAll('.stem-box');
    updatedStemBoxes.forEach((box, index) => {
        if (index > 0) {
            const stemId = parseInt(box.dataset.stemId.split('-')[1]);
            highlightDifferences(stemId);
        }
    });
}

function addNewStem(initialData = null) {
    const stemId = stemCount;
    stemCount++;
    
    const stemContainer = document.getElementById('stemContainer');
    
    // Create a new stem box
    const stemBox = document.createElement('div');
    stemBox.className = 'stem-box';
    stemBox.dataset.stemId = `stem-${stemId}`;
    
    // Create title container with title and close button
    const titleContainer = document.createElement('div');
    titleContainer.className = 'title-container';
    
    // Add stem title
    const stemTitle = document.createElement('h3');
    stemTitle.className = 'stem-title';
    // Get the current number of stems and add 1 for the new stem number
    const currentStemCount = document.querySelectorAll('.stem-box').length + 1;
    stemTitle.textContent = `Stem ${currentStemCount}`;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'title-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = function() { deleteStem(stemId); };
    
    // Hide the delete button on Stem 2 (stemId = 1)
    if (stemId === 1) {
        closeBtn.style.visibility = 'hidden';
    }
    
    // Add title and close button to container
    titleContainer.appendChild(stemTitle);
    titleContainer.appendChild(closeBtn);
    
    // Add title container to stem box
    stemBox.appendChild(titleContainer);
    
    // Clone the input section from the first stem
    const inputSection = document.querySelector('.input-section').cloneNode(true);
    
    // Update IDs and values
    const inputs = inputSection.querySelectorAll('input');
    inputs.forEach(input => {
        const fieldName = input.id.split('-')[0];
        input.id = `${fieldName}-${stemId}`;
        input.dataset.stemId = stemId;
        input.classList.add('stem-input');
    });
    
    // Update input values if initial data is provided
    if (initialData) {
        inputs.forEach(input => {
            const fieldName = input.id.split('-')[0];
            input.value = initialData[fieldName];
        });
    }
    
    stemBox.appendChild(inputSection);
    
    // Create results section
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-container';
    
    const resultsGroup = document.createElement('div');
    resultsGroup.className = 'results-group';
    
    const reachDiv = document.createElement('div');
    reachDiv.id = `effectiveReach-${stemId}`;
    reachDiv.innerHTML = 'Run (X): 0mm';
    
    const spacerDiv = document.createElement('div');
    spacerDiv.className = 'results-spacer';
    
    const stackDiv = document.createElement('div');
    stackDiv.id = `effectiveStack-${stemId}`;
    stackDiv.className = 'stack-result';
    stackDiv.innerHTML = 'Rise (Y): 0mm';
    
    resultsGroup.appendChild(reachDiv);
    resultsGroup.appendChild(spacerDiv);
    resultsGroup.appendChild(stackDiv);
    resultsDiv.appendChild(resultsGroup);
    
    stemBox.appendChild(resultsDiv);
    
    // Add the new stem to the container
    stemContainer.appendChild(stemBox);
    
    // Add event listeners to the new inputs
    const newInputs = stemBox.querySelectorAll('input');
    newInputs.forEach(input => {
        input.addEventListener('input', function() {
            calculateStemDimensions(stemId);
            highlightDifferences(stemId); // Highlight differences when input changes
            saveStemData(); // Save data when input changes
        });
    });
    
    // Calculate initial values
    calculateStemDimensions(stemId);
    
    // Highlight differences initially
    highlightDifferences(stemId);
}

function deleteStem(stemId) {
    const stemBoxes = document.querySelectorAll('.stem-box');
    
    // If this is Stem 2 (stemId = 1) and there are only 2 stems total, don't delete it
    if (stemId === 1 && stemBoxes.length === 2) {
        // Instead of deleting, just reset it to default values
        document.getElementById('headTubeAngle-1').value = DEFAULT_VALUES.headTubeAngle;
        document.getElementById('stemHeight-1').value = DEFAULT_VALUES.stemHeight;
        document.getElementById('stemLength-1').value = DEFAULT_VALUES.stemLength;
        document.getElementById('stemAngle-1').value = DEFAULT_VALUES.stemAngle;
        document.getElementById('spacerHeight-1').value = DEFAULT_VALUES.spacerHeight;
        
        // Recalculate and highlight
        calculateStemDimensions(1);
        highlightDifferences(1);
        
        // Save data
        saveStemData();
        return;
    }
    
    const stemBox = document.querySelector(`[data-stem-id="stem-${stemId}"]`);
    if (stemBox) {
        stemBox.remove();
        updateStemNumbers();
        
        // Recalculate and rehighlight all remaining stems
        calculateStemDimensions(0);
        
        // Apply highlighting to all remaining stems
        const remainingStemBoxes = document.querySelectorAll('.stem-box');
        remainingStemBoxes.forEach((box, index) => {
            if (index > 0) {
                const stemId = parseInt(box.dataset.stemId.split('-')[1]);
                highlightDifferences(stemId);
            }
        });
        
        saveStemData(); // Save data after deleting stem
    }
}

function updateStemNumbers() {
    const stemBoxes = document.querySelectorAll('.stem-box');
    stemBoxes.forEach((box, index) => {
        const stemTitle = box.querySelector('.stem-title');
        if (stemTitle) {
            stemTitle.textContent = `Stem ${index + 1}`;
        }
    });
}

// Add new functions for auto-save/load
function autoSaveStemData() {
    const stems = [];
    const stemBoxes = document.querySelectorAll('.stem-box');
    
    stemBoxes.forEach((box, index) => {
        const stemId = parseInt(box.dataset.stemId.split('-')[1]);
        const data = {
            headTubeAngle: parseFloat(document.getElementById(`headTubeAngle-${stemId}`).value),
            stemHeight: parseFloat(document.getElementById(`stemHeight-${stemId}`).value),
            stemLength: parseFloat(document.getElementById(`stemLength-${stemId}`).value),
            stemAngle: parseFloat(document.getElementById(`stemAngle-${stemId}`).value),
            spacerHeight: parseFloat(document.getElementById(`spacerHeight-${stemId}`).value)
        };
        stems.push(data);
    });
    
    localStorage.setItem('autoSavedStemData', JSON.stringify(stems));
}

function autoLoadStemData() {
    const savedData = localStorage.getItem('autoSavedStemData');
    if (!savedData) return;
    
    const stems = JSON.parse(savedData);
    
    // Remove all existing stems except the first one
    const stemBoxes = document.querySelectorAll('.stem-box');
    stemBoxes.forEach((box, index) => {
        if (index > 0) box.remove();
    });
    
    // Update first stem
    if (stems.length > 0) {
        const firstStem = stems[0];
        document.getElementById('headTubeAngle-0').value = firstStem.headTubeAngle;
        document.getElementById('stemHeight-0').value = firstStem.stemHeight;
        document.getElementById('stemLength-0').value = firstStem.stemLength;
        document.getElementById('stemAngle-0').value = firstStem.stemAngle;
        document.getElementById('spacerHeight-0').value = firstStem.spacerHeight;
    }
    
    // Add additional stems
    for (let i = 1; i < stems.length; i++) {
        addNewStem(stems[i]);
    }
    
    // If there's no Stem 2, add it with default values
    if (stems.length === 1) {
        addNewStem();
    }
    
    // Recalculate all stems
    calculateStemDimensions(0);
    
    // Apply highlighting to all stems
    const updatedStemBoxes = document.querySelectorAll('.stem-box');
    updatedStemBoxes.forEach((box, index) => {
        if (index > 0) {
            const stemId = parseInt(box.dataset.stemId.split('-')[1]);
            highlightDifferences(stemId);
        }
    });
}

function resetAllStems() {
    // Remove all stems except the first two
    const stemBoxes = document.querySelectorAll('.stem-box');
    stemBoxes.forEach((box, index) => {
        if (index > 1) box.remove();
    });
    
    // Reset Stem 1 to default values
    document.getElementById('headTubeAngle-0').value = DEFAULT_VALUES.headTubeAngle;
    document.getElementById('stemHeight-0').value = DEFAULT_VALUES.stemHeight;
    document.getElementById('stemLength-0').value = DEFAULT_VALUES.stemLength;
    document.getElementById('stemAngle-0').value = DEFAULT_VALUES.stemAngle;
    document.getElementById('spacerHeight-0').value = DEFAULT_VALUES.spacerHeight;
    
    // Reset Stem 2 to default values if it exists
    if (document.getElementById('headTubeAngle-1')) {
        document.getElementById('headTubeAngle-1').value = DEFAULT_VALUES.headTubeAngle;
        document.getElementById('stemHeight-1').value = DEFAULT_VALUES.stemHeight;
        document.getElementById('stemLength-1').value = DEFAULT_VALUES.stemLength;
        document.getElementById('stemAngle-1').value = DEFAULT_VALUES.stemAngle;
        document.getElementById('spacerHeight-1').value = DEFAULT_VALUES.spacerHeight;
    }
    
    // Recalculate all stems
    calculateStemDimensions(0);
    
    // Apply highlighting to Stem 2
    if (document.getElementById('headTubeAngle-1')) {
        highlightDifferences(1);
    }
    
    // Update stem count
    stemCount = 2;
    
    // Save data
    autoSaveStemData();
}

// Modify the initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for highlighting different values
    const style = document.createElement('style');
    style.textContent = `
        .highlight-different {
            background-color: rgba(255, 204, 0, 0.2) !important;
            border-left: 3px solid #FFC107 !important;
            padding-left: 3px !important;
        }
        .input-field {
            transition: background-color 0.3s ease, border-left 0.3s ease;
            border-left: 3px solid transparent;
            padding-left: 0px;
        }
        .reset-all-btn:hover {
            background-color: var(--error-color) !important;
            color: white !important;
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners to all inputs in the first stem
    const inputs = document.querySelectorAll('.stem-input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            calculateStemDimensions(parseInt(this.dataset.stemId));
            autoSaveStemData(); // Auto-save when input changes
        });
    });
    
    // Add event listener to the Add Stem button
    document.getElementById('addStemBtn').addEventListener('click', () => {
        addNewStem();
        autoSaveStemData(); // Auto-save after adding new stem
    });
    
    // Add event listener to the Reset All button
    document.getElementById('resetAllBtn').addEventListener('click', resetAllStems);
    
    // Add event listener for page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            autoSaveStemData(); // Auto-save when leaving the page
        }
    });
    
    // Try to load auto-saved data first, then fall back to manual saved data
    const autoSavedData = localStorage.getItem('autoSavedStemData');
    if (autoSavedData) {
        autoLoadStemData();
    } else {
        loadStemData();
    }
    
    // If no saved data at all, do initial calculation and add Stem 2
    if (!localStorage.getItem('autoSavedStemData') && !localStorage.getItem('stemCalculatorData')) {
        calculateStemDimensions(0);
        
        // Add Stem 2 by default
        addNewStem();
    } else {
        // Check if we need to add Stem 2 (if there's only Stem 1)
        const stemBoxes = document.querySelectorAll('.stem-box');
        if (stemBoxes.length === 1) {
            addNewStem();
        }
    }
});

// Add window unload handler
window.addEventListener('beforeunload', () => {
    autoSaveStemData(); // Auto-save before page unload
}); 