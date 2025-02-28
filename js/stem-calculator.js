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
        `<span class="run-value">Run (X): ${totalX.toFixed(0)}mm</span>${id === 0 || !diffXText ? '' : `<br><span class="diff-text">${diffXText}</span>`}`;
    document.getElementById(`effectiveStack-${id}`).innerHTML = 
        `<span class="rise-value">Rise (Y): ${totalY.toFixed(0)}mm</span>${id === 0 || !diffYText ? '' : `<br><span class="diff-text">${diffYText}</span>`}`;
    
    // If this is the first stem, store its values as the base for comparison
    if (id === 0) {
        baseX = totalX;
        baseY = totalY;
        
        // Recalculate all other stems to update their differences
        for (let i = 1; i < stemCount; i++) {
            if (document.getElementById(`headTubeAngle-${i}`)) {
                calculateStemDimensions(i);
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
            `<span class="run-value">Run (X): ${totalX.toFixed(0)}mm</span>${!diffXText ? '' : `<br><span class="diff-text">${diffXText}</span>`}`;
        document.getElementById(`effectiveStack-${id}`).innerHTML = 
            `<span class="rise-value">Rise (Y): ${totalY.toFixed(0)}mm</span>${!diffYText ? '' : `<br><span class="diff-text">${diffYText}</span>`}`;
    }
    
    return { x: totalX, y: totalY };
}

function addNewStem() {
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
    
    stemBox.appendChild(inputSection);
    
    // Create results section
    const resultsDiv = document.createElement('div');
    resultsDiv.style = 'display: flex; flex-direction: column; align-items: center;';
    
    const resultsGroup = document.createElement('div');
    resultsGroup.className = 'results-group';
    resultsGroup.style = 'margin-top: 10px; background-color: var(--card-background); padding: 16px; border-radius: 8px; box-shadow: 0 2px 4px var(--shadow-color); width: 260px; font-size: 16px; font-weight: bold; text-align: center;';
    
    const reachDiv = document.createElement('div');
    reachDiv.id = `effectiveReach-${stemId}`;
    reachDiv.innerHTML = '<span class="run-value">Run (X): 0mm</span>';
    
    const spacerDiv = document.createElement('div');
    spacerDiv.style = 'height: 10px;';
    
    const stackDiv = document.createElement('div');
    stackDiv.id = `effectiveStack-${stemId}`;
    stackDiv.style = 'margin-top: 0px;';
    stackDiv.innerHTML = '<span class="rise-value">Rise (Y): 0mm</span>';
    
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
        });
    });
    
    // Calculate initial values
    calculateStemDimensions(stemId);
}

function deleteStem(stemId) {
    const stemBox = document.querySelector(`[data-stem-id="stem-${stemId}"]`);
    if (stemBox) {
        stemBox.remove();
        updateStemNumbers();
    }
}

function updateStemNumbers() {
    // Get all stem boxes
    const stemBoxes = document.querySelectorAll('.stem-box');
    
    // Update each stem title with the correct sequential number
    stemBoxes.forEach((box, index) => {
        const stemTitle = box.querySelector('.stem-title');
        if (stemTitle) {
            stemTitle.textContent = `Stem ${index + 1}`;
        }
    });
}

// Initialize the calculator when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to all inputs in the first stem
    const inputs = document.querySelectorAll('.stem-input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            calculateStemDimensions(parseInt(this.dataset.stemId));
        });
    });
    
    // Add event listener to the Add Stem button
    document.getElementById('addStemBtn').addEventListener('click', addNewStem);
    
    // Initial calculation
    calculateStemDimensions(0);
}); 