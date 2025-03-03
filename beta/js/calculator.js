class BikeCalculator {
    constructor() {
        this.database = new BikeDatabase();
        this.bikes = [];
        this.bikeCount = 0;
        
        // Initialize database and event listeners
        this.initialize();
        
        // Initialize dark mode
        this.initializeDarkMode();
    }

    initializeDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const theme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');
        
        // Set initial theme
        document.documentElement.setAttribute('data-theme', theme);
        this.updateDarkModeButton(theme);
        
        // Add click event listener
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateDarkModeButton(newTheme);
        });
        
        // Listen for system theme changes
        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                this.updateDarkModeButton(newTheme);
            }
        });
    }

    updateDarkModeButton(theme) {
        const button = document.getElementById('darkModeToggle');
        const icon = button.querySelector('.toggle-icon');
        const text = button.querySelector('.toggle-text');
        
        if (theme === 'dark') {
            icon.textContent = '🌙';
            text.textContent = 'Dark Mode';
        } else {
            icon.textContent = '☀️';
            text.textContent = 'Light Mode';
        }
    }

    async initialize() {
        try {
            // Initialize the database first
            await this.database.initialize();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Check if there's saved data from the current session
            const savedData = localStorage.getItem('xyCalculatorData');
            if (savedData) {
                const data = JSON.parse(savedData);
                const sessionStart = sessionStorage.getItem('xyCalculatorSession');
                
                // Load data if we have it, regardless of session
                this.loadSavedData();
                
                // Set new session timestamp if none exists
                if (!sessionStart) {
                    sessionStorage.setItem('xyCalculatorSession', Date.now().toString());
                }
            } else {
                // Start fresh with default bikes
                for (let i = 0; i < 2; i++) {
                    this.addBike();
                }
                this.addManualBike();
                
                // Set new session timestamp
                sessionStorage.setItem('xyCalculatorSession', Date.now().toString());
            }
        } catch (error) {
            console.error('Failed to initialize calculator:', error);
            this.showCustomAlert('Failed to load bike database. Please check your internet connection and try again.');
        }
    }

    initializeEventListeners() {
        // Add bike buttons
        document.getElementById('addBike').addEventListener('click', () => this.addBike());
        document.getElementById('addManualBike').addEventListener('click', () => this.addManualBike());

        // Print button
        document.getElementById('printButton').addEventListener('click', () => this.printBikeData());

        // Clear all data button
        document.getElementById('clearAllData').addEventListener('click', () => {
            // Check if there's already a confirmation dialog open
            if (document.querySelector('.confirm-dialog')) {
                return; // Don't create multiple dialogs
            }
            
            // Create custom confirmation dialog instead of using native confirm()
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'confirm-dialog';
            confirmDialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--card-bg);
                color: var(--text-color);
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                max-width: 400px;
                width: 90%;
                text-align: center;
                z-index: 1001;
            `;
            
            confirmDialog.innerHTML = `
                <h3 style="margin-top: 0;">Confirm Reset</h3>
                <p>Are you sure you want to reset the XY Calculator? This will clear all bike data and measurements.</p>
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                    <button class="cancel-button">Cancel</button>
                    <button class="confirm-button">Reset</button>
                </div>
            `;
            
            // Create overlay for confirmation dialog
            const confirmOverlay = document.createElement('div');
            confirmOverlay.className = 'confirm-dialog-overlay';
            confirmOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
            `;
            
            // Add to DOM
            document.body.appendChild(confirmOverlay);
            document.body.appendChild(confirmDialog);
            
            // Style buttons
            const cancelButton = confirmDialog.querySelector('.cancel-button');
            cancelButton.style.cssText = `
                padding: 8px 16px;
                background: transparent;
                color: var(--text-color);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            `;
            
            const confirmButton = confirmDialog.querySelector('.confirm-button');
            confirmButton.style.cssText = `
                padding: 8px 16px;
                background: #FF3B30;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            `;
            
            // Function to close the dialog
            const closeDialog = () => {
                if (document.body.contains(confirmDialog)) {
                    document.body.removeChild(confirmDialog);
                }
                if (document.body.contains(confirmOverlay)) {
                    document.body.removeChild(confirmOverlay);
                }
                // Remove keyboard event listener
                document.removeEventListener('keydown', handleKeyDown);
            };
            
            // Handle keyboard events
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeDialog();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    // Perform reset operation
                    resetCalculator();
                    closeDialog();
                }
            };
            
            // Function to reset the calculator
            const resetCalculator = () => {
                // Clear only XY calculator data from localStorage
                localStorage.removeItem('xyCalculatorData');
                
                // Clear input fields
                document.getElementById('clientName').value = '';
                document.getElementById('targetSaddleX').value = '';
                document.getElementById('targetSaddleY').value = '';
                document.getElementById('targetHandlebarX').value = '';
                document.getElementById('targetHandlebarY').value = '';
                document.getElementById('handlebarReachUsed').value = '';
                
                // Clear bikes container
                document.getElementById('bikes-container').innerHTML = '';
                this.bikes = [];
                
                // Add default bikes
                for (let i = 0; i < 2; i++) {
                    this.addBike();
                }
                this.addManualBike();
                
                // Disable save button
                document.getElementById('saveButton').disabled = true;
            };
            
            // Add keyboard event listener
            document.addEventListener('keydown', handleKeyDown);
            
            // Add event listeners
            cancelButton.onclick = closeDialog;
            
            confirmButton.onclick = () => {
                resetCalculator();
                closeDialog();
            };
            
            // Focus the cancel button by default (safer option)
            cancelButton.focus();
        });

        // Client name input
        const clientNameInput = document.getElementById('clientName');
        clientNameInput.addEventListener('input', () => {
            document.getElementById('saveButton').disabled = !clientNameInput.value.trim();
            this.saveData();
        });

        // Save/Load buttons
        document.getElementById('saveButton').addEventListener('click', () => this.saveInstance());
        document.getElementById('loadButton').addEventListener('click', () => this.showLoadDialog());

        // Target position inputs - these should update ALL bike cards
        ['targetSaddleX', 'targetSaddleY', 'targetHandlebarX', 'targetHandlebarY', 'handlebarReachUsed']
            .forEach(id => {
                document.getElementById(id).addEventListener('input', () => {
                    // When target positions change, update ALL bike cards
                    this.updateCalculations();
                    this.saveData();
                });
            });
        
        // Initialize drag and drop functionality
        this.initializeDragAndDrop();
    }

    initializeDragAndDrop() {
        const bikesContainer = document.getElementById('bikes-container');
        
        // Event delegation for drag handles
        bikesContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('drag-handle') || e.target.closest('.drag-handle')) {
                const bikeCard = e.target.closest('.bike-card');
                if (bikeCard) {
                    this.handleDragStart(bikeCard, e);
                }
            }
        });
        
        // Prevent default drag behavior on bike cards
        bikesContainer.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('bike-card')) {
                e.preventDefault();
            }
        });
    }

    handleDragStart(bikeCard, startEvent) {
        const bikesContainer = document.getElementById('bikes-container');
        const initialX = startEvent.clientX;
        const bikeCards = Array.from(document.querySelectorAll('.bike-card'));
        const startIndex = bikeCards.indexOf(bikeCard);
        const bikeRect = bikeCard.getBoundingClientRect();
        const containerRect = bikesContainer.getBoundingClientRect();
        
        // Calculate the offset between cursor and card's left edge
        const cursorOffsetX = initialX - bikeRect.left;
        
        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        
        // Add dragging class
        bikeCard.classList.add('dragging');
        
        // Create placeholder for original position
        const placeholder = document.createElement('div');
        placeholder.className = 'bike-card-placeholder';
        placeholder.style.width = `${bikeRect.width}px`;
        placeholder.style.height = `${bikeRect.height}px`;
        placeholder.style.flex = '0 0 auto';
        placeholder.style.margin = '0 6px';
        
        // Store original position
        const originalPosition = {
            left: bikeRect.left,
            top: bikeRect.top
        };
        
        // Set fixed positioning for dragged element
        bikeCard.style.position = 'fixed';
        bikeCard.style.zIndex = '1000';
        bikeCard.style.width = `${bikeRect.width}px`;
        bikeCard.style.left = `${originalPosition.left}px`;
        bikeCard.style.top = `${originalPosition.top}px`;
        
        // Insert placeholder
        bikeCard.parentNode.insertBefore(placeholder, bikeCard);
        
        const handleMove = (moveEvent) => {
            // Calculate new position based on cursor position and initial offset
            const newLeft = moveEvent.clientX - cursorOffsetX;
            
            // Update position
            bikeCard.style.left = `${newLeft}px`;
            
            // Find the card we're hovering over
            const cardWidth = bikeRect.width;
            const cardCenter = newLeft + (cardWidth / 2);
            
            // Get updated list of cards (excluding the dragged one)
            const currentCards = Array.from(document.querySelectorAll('.bike-card:not(.dragging)'));
            
            // Find the card we should insert before
            let nextCard = currentCards.find(card => {
                const rect = card.getBoundingClientRect();
                return rect.left + rect.width / 2 > cardCenter;
            });
            
            // Move placeholder if needed
            if (nextCard) {
                bikesContainer.insertBefore(placeholder, nextCard);
            } else {
                // Always append to the end if no next card is found
                bikesContainer.appendChild(placeholder);
            }
            
            // Auto-scroll if near edges
            const scrollThreshold = 100;
            if (moveEvent.clientX - containerRect.left < scrollThreshold) {
                // Scroll left
                bikesContainer.scrollLeft -= 10;
            } else if (containerRect.right - moveEvent.clientX < scrollThreshold) {
                // Scroll right
                bikesContainer.scrollLeft += 10;
            }
        };
        
        const handleEnd = () => {
            // Remove event listeners
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.body.style.userSelect = '';
            
            // Replace placeholder with bike card
            bikeCard.classList.remove('dragging');
            bikeCard.style.position = '';
            bikeCard.style.zIndex = '';
            bikeCard.style.width = '';
            bikeCard.style.left = '';
            bikeCard.style.top = '';
            
            if (placeholder.parentNode) {
                placeholder.parentNode.insertBefore(bikeCard, placeholder);
                placeholder.parentNode.removeChild(placeholder);
            }
            
            // Update the bikes array to match the new DOM order
            const newBikeCards = Array.from(document.querySelectorAll('.bike-card'));
            const newBikes = newBikeCards.map(card => {
                return this.bikes.find(bike => bike.id === card.id);
            });
            
            this.bikes = newBikes;
        };
        
        // Add event listeners for drag
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }

    addBike() {
        const bikeData = {
            id: `bike-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            isManual: false,
            brand: '',
            model: '',
            size: '',
            reach: '',
            stack: '',
            hta: '',
            sta: '',
            stl: '',
            stemLength: 100,
            stemAngle: -6,
            spacersHeight: 20,
            handlebarReach: 80,
            saddleSetback: 0,
            saddleHeight: 0
        };
        
        this.bikes.push(bikeData);
        this.renderBikeCard(bikeData, this.bikes.length - 1);
        this.updateCalculationsForBike(bikeData.id);
        
        // Setup bike selectors for the new bike
        if (!bikeData.isManual) {
            this.setupBikeSelectors(bikeData.id);
        }
    }

    addManualBike() {
        const bikeData = {
            id: `manual-bike-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            isManual: true,
            brand: '',
            model: '',
            size: '',
            reach: '',
            stack: '',
            hta: '',
            sta: '',
            stl: '',
            stemLength: 100,
            stemAngle: -6,
            spacersHeight: 20,
            handlebarReach: 80,
            saddleSetback: 0,
            saddleHeight: 0
        };
        
        this.bikes.push(bikeData);
        this.renderBikeCard(bikeData, this.bikes.length - 1);
        this.updateCalculationsForBike(bikeData.id);
    }

    renderBikeCard(bikeData, index) {
        const bikeCard = document.createElement('div');
        bikeCard.className = 'bike-card';
        bikeCard.id = bikeData.id;
        bikeCard.innerHTML = this.getBikeCardHTML(index, bikeData.isManual);
        
        document.getElementById('bikes-container').appendChild(bikeCard);
        
        // Initialize bike card inputs and event listeners
        this.initializeBikeCardInputs(bikeCard, bikeData, index);
    }

    getBikeCardHTML(index, isManual) {
        return `
            <div class="drag-handle" title="Drag to reorder"></div>
            ${isManual ? this.getManualInputsHTML() : this.getBikeSelectorHTML()}
            <div class="geometry-section">
                <div class="input-group">
                    <label>Reach:</label>
                    <input type="number" class="reach" value="" ${!isManual ? 'readonly' : ''}>
                    <span>mm</span>
                </div>
                <div class="input-group">
                    <label>Stack:</label>
                    <input type="number" class="stack" value="" ${!isManual ? 'readonly' : ''}>
                    <span>mm</span>
                </div>
                <div class="input-group">
                    <label>Head Tube Angle:</label>
                    <input type="number" class="hta" value="" ${!isManual ? 'readonly' : ''}>
                    <span>°</span>
                </div>
                <div class="input-group">
                    <label>Seat Tube Angle:</label>
                    <input type="number" class="sta" value="" ${!isManual ? 'readonly' : ''}>
                    <span>°</span>
                </div>
                <div class="input-group">
                    <label>Seat Tube Length:</label>
                    <input type="number" class="stl" value="" ${!isManual ? 'readonly' : ''}>
                    <span>mm</span>
                </div>
            </div>
            <div class="stem-section">
                <h4>Stem Configuration</h4>
                <div class="input-group">
                    <label>Stem Height:</label>
                    <input type="number" class="stem-height" value="40" min="0">
                    <span>mm</span>
                </div>
                <div class="input-group">
                    <label>Stem Length:</label>
                    <input type="number" class="stem-length" value="100" min="0">
                    <span>mm</span>
                </div>
                <div class="input-group">
                    <label>Stem Angle:</label>
                    <input type="number" class="stem-angle" value="-6">
                    <span>°</span>
                </div>
                <div class="input-group">
                    <label>Spacer Height:</label>
                    <input type="number" class="spacer-height" value="20" min="0">
                    <span>mm</span>
                </div>
            </div>
            <div class="results-section">
                <h4>Results</h4>
                <div class="result-group">
                    <label>Handlebar X:</label>
                    <span class="handlebar-x">-- mm</span>
                </div>
                <div class="result-group">
                    <label>Handlebar Y:</label>
                    <span class="handlebar-y">-- mm</span>
                </div>
                <div class="result-group with-divider">
                    <label>Bar Reach Needed:</label>
                    <span class="bar-reach-needed">-- mm</span>
                </div>
                <div class="result-group">
                    <label>Setback vs STA:</label>
                    <span class="setback-sta">-- mm</span>
                </div>
                <div class="result-group">
                    <label>Effective STA:</label>
                    <span class="effective-sta">-- °</span>
                </div>
                <div class="result-group">
                    <label>BB to Rail:</label>
                    <span class="bb-rail">-- mm</span>
                </div>
                <div class="result-group">
                    <label>Exposed Seatpost:</label>
                    <span class="exposed-seatpost">-- mm</span>
                </div>
            </div>
            <div class="button-group">
                <button class="reset-button">RESET</button>
                <button class="duplicate-button">DUPLICATE</button>
                <button class="delete-button">🗑️</button>
            </div>
        `;
    }

    getBikeSelectorHTML() {
        return `
            <div class="bike-selector">
                <select class="brand-select">
                    <option value="">Select Brand</option>
                </select>
                <select class="model-select" disabled>
                    <option value="">Select Model</option>
                </select>
                <select class="size-select" disabled>
                    <option value="">Select Size</option>
                </select>
            </div>
        `;
    }

    getManualInputsHTML() {
        return `
            <div class="manual-inputs">
                <div class="input-group">
                    <label>Brand:</label>
                    <input type="text" class="brand-input" placeholder="Manual Entry">
                </div>
                <div class="input-group">
                    <label>Model:</label>
                    <input type="text" class="model-input">
                </div>
                <div class="input-group">
                    <label>Size:</label>
                    <input type="text" class="size-input">
                </div>
            </div>
        `;
    }

    initializeBikeCardInputs(bikeCard, bikeData, index) {
        const card = document.getElementById(bikeData.id);

        // Setup input listeners for all numeric inputs
        card.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', () => {
                this.updateBikeData(bikeData.id);
            });
        });

        // Setup manual input listeners if applicable
        if (bikeData.isManual) {
            card.querySelectorAll('.manual-inputs input').forEach(input => {
                input.addEventListener('input', () => {
                    this.updateBikeData(bikeData.id);
                });
            });

            // Set initial values for manual bike
            card.querySelector('.brand-input').value = bikeData.brand;
            card.querySelector('.model-input').value = bikeData.model;
            card.querySelector('.size-input').value = bikeData.size;
            card.querySelector('.reach').value = bikeData.reach;
            card.querySelector('.stack').value = bikeData.stack;
            card.querySelector('.hta').value = bikeData.hta;
            card.querySelector('.sta').value = bikeData.sta;
            card.querySelector('.stl').value = bikeData.stl;
            card.querySelector('.stem-length').value = bikeData.stemLength;
            card.querySelector('.stem-angle').value = bikeData.stemAngle;
            card.querySelector('.spacer-height').value = bikeData.spacersHeight;
        }

        // Setup button listeners
        card.querySelector('.reset-button').addEventListener('click', () => {
            this.resetBike(bikeData.id);
        });

        card.querySelector('.duplicate-button').addEventListener('click', () => {
            this.duplicateBike(bikeData.id);
        });

        card.querySelector('.delete-button').addEventListener('click', () => {
            this.deleteBike(bikeData.id);
        });
    }

    updateBikeData(bikeId) {
        const bike = this.bikes.find(b => b.id === bikeId);
        if (!bike) return;
        
        const card = document.getElementById(bikeId);
        
        // Update bike data from inputs
        bike.reach = parseFloat(card.querySelector('.reach').value) || '';
        bike.stack = parseFloat(card.querySelector('.stack').value) || '';
        bike.hta = parseFloat(card.querySelector('.hta').value) || '';
        bike.sta = parseFloat(card.querySelector('.sta').value) || '';
        bike.stl = parseFloat(card.querySelector('.stl').value) || '';
        
        // Treat blank stem configuration fields as 0
        const stemLengthValue = card.querySelector('.stem-length').value;
        const stemAngleValue = card.querySelector('.stem-angle').value;
        const spacerHeightValue = card.querySelector('.spacer-height').value;
        
        bike.stemLength = stemLengthValue === '' ? 0 : parseFloat(stemLengthValue);
        bike.stemAngle = stemAngleValue === '' ? 0 : parseFloat(stemAngleValue);
        bike.spacersHeight = spacerHeightValue === '' ? 0 : parseFloat(spacerHeightValue);
        
        // If it's a manual bike, update brand/model/size
        if (bike.isManual) {
            bike.brand = card.querySelector('.brand-input').value || '';
            bike.model = card.querySelector('.model-input').value || '';
            bike.size = card.querySelector('.size-input').value || '';
        }
        
        // Find the index of the bike in the array
        const bikeIndex = this.bikes.findIndex(b => b.id === bikeId);
        if (bikeIndex !== -1) {
            this.updateCalculationsForBike(bikeId);
            this.saveData(); // Save data after any bike update
        }
    }

    updateCalculations() {
        // Update calculations for all bikes
        this.bikes.forEach(bike => {
            this.updateCalculationsForBike(bike.id);
        });
    }

    updateCalculationsForBike(bikeId) {
        const targetSaddleX = parseFloat(document.getElementById('targetSaddleX').value) || '';
        const targetSaddleY = parseFloat(document.getElementById('targetSaddleY').value) || '';
        const targetHandlebarX = parseFloat(document.getElementById('targetHandlebarX').value) || '';
        const targetHandlebarY = parseFloat(document.getElementById('targetHandlebarY').value) || '';
        const handlebarReachUsed = parseFloat(document.getElementById('handlebarReachUsed').value) || '';

        const bike = this.bikes.find(b => b.id === bikeId);
        if (!bike) return;
        
        const card = document.getElementById(bikeId);
        
        // Check if required geometry values exist
        const hasRequiredGeometry = bike.reach && bike.stack && bike.hta;
        
        // Calculate handlebar position only if we have the required geometry
        let handlebarX = '-- ';
        let handlebarY = '-- ';
        let barReachNeeded = '-- ';
        let handlebarXDiff = '';
        let handlebarYDiff = '';
        
        if (hasRequiredGeometry) {
            const htaRad = (180 - bike.hta) * Math.PI / 180;
            
            // Ensure stemAngle is treated as a number (could be 0)
            const stemAngle = bike.stemAngle !== undefined && bike.stemAngle !== '' ? bike.stemAngle : 0;
            const stemRad = (90 - bike.hta + stemAngle) * Math.PI / 180;
            
            // Ensure spacersHeight is treated as a number (could be 0)
            const spacersHeight = bike.spacersHeight !== undefined && bike.spacersHeight !== '' ? bike.spacersHeight : 0;
            const stemCenterX = (spacersHeight + 20) * Math.cos(htaRad); // Using 20mm as default stem height
            const stemCenterY = (spacersHeight + 20) * Math.sin(htaRad);
            
            // Ensure stemLength is treated as a number (could be 0)
            const stemLength = bike.stemLength !== undefined && bike.stemLength !== '' ? bike.stemLength : 0;
            const clampX = stemLength * Math.cos(stemRad);
            const clampY = stemLength * Math.sin(stemRad);
            
            handlebarX = bike.reach + stemCenterX + clampX;
            handlebarY = bike.stack + stemCenterY + clampY;

            // Calculate bar reach needed
            if (targetHandlebarX && handlebarReachUsed) {
                barReachNeeded = targetHandlebarX + handlebarReachUsed - Math.round(handlebarX);
            }

            // Calculate differences between target and actual handlebar positions
            if (targetHandlebarX) {
                const xDiff = Math.round(handlebarX) - targetHandlebarX;
                handlebarXDiff = xDiff > 0 ? `+${xDiff}` : `${xDiff}`;
            }
            
            if (targetHandlebarY) {
                const yDiff = Math.round(handlebarY) - targetHandlebarY;
                handlebarYDiff = yDiff > 0 ? `+${yDiff}` : `${yDiff}`;
            }
        }

        // Calculate saddle position metrics
        let setbackVsSTA = '--';
        let effectiveSTA = '--';
        let bbToRail = '--';
        let exposedSeatpost = '--';

        if (targetSaddleX && targetSaddleY && bike.sta) {
            const seatTubeX = targetSaddleY * Math.tan((90 - bike.sta) * Math.PI / 180);
            setbackVsSTA = Math.round(seatTubeX - targetSaddleX);
            
            const angleFromVertical = Math.atan2(targetSaddleX, targetSaddleY) * 180 / Math.PI;
            effectiveSTA = (90 - angleFromVertical).toFixed(1);
            
            const dx = targetSaddleX;
            const dy = targetSaddleY;
            bbToRail = Math.round(Math.sqrt(dx * dx + dy * dy));
            
            if (bike.stl) {
                exposedSeatpost = Math.round(bbToRail - bike.stl);
            }
        }

        // Update display
        if (hasRequiredGeometry) {
            card.querySelector('.handlebar-x').textContent = `${Math.round(handlebarX)} mm`;
            if (handlebarXDiff) {
                const xArrow = parseInt(handlebarXDiff) > 0 ? '→' : '←';
                card.querySelector('.handlebar-x').innerHTML = `${Math.round(handlebarX)} mm <span class="diff ${parseInt(handlebarXDiff) > 0 ? 'negative' : 'positive'}">(${handlebarXDiff} ${xArrow})</span>`;
            }
            
            card.querySelector('.handlebar-y').textContent = `${Math.round(handlebarY)} mm`;
            if (handlebarYDiff) {
                const yArrow = parseInt(handlebarYDiff) > 0 ? '↑' : '↓';
                card.querySelector('.handlebar-y').innerHTML = `${Math.round(handlebarY)} mm <span class="diff ${parseInt(handlebarYDiff) > 0 ? 'positive' : 'negative'}">(${handlebarYDiff} ${yArrow})</span>`;
            }
            
            card.querySelector('.bar-reach-needed').textContent = 
                (targetHandlebarX && handlebarReachUsed) ? `${barReachNeeded} mm` : '-- mm';
        } else {
            // If we don't have required geometry, display placeholder values
            card.querySelector('.handlebar-x').textContent = '-- mm';
            card.querySelector('.handlebar-y').textContent = '-- mm';
            card.querySelector('.bar-reach-needed').textContent = '-- mm';
        }
        
        card.querySelector('.setback-sta').textContent = 
            typeof setbackVsSTA === 'number' ? `${setbackVsSTA > 0 ? '+' : ''}${setbackVsSTA} mm` : setbackVsSTA;
        card.querySelector('.effective-sta').textContent = 
            effectiveSTA !== '--' ? `${effectiveSTA}°` : effectiveSTA;
        card.querySelector('.bb-rail').textContent = 
            bbToRail !== '--' ? `${bbToRail} mm` : bbToRail;
        card.querySelector('.exposed-seatpost').textContent = 
            exposedSeatpost !== '--' ? `${exposedSeatpost} mm` : exposedSeatpost;
    }

    resetBike(bikeId) {
        const bike = this.bikes.find(b => b.id === bikeId);
        if (!bike) return;
        
        const card = document.getElementById(bikeId);
        
        // Reset to default values
        bike.reach = '';
        bike.stack = '';
        bike.hta = '';
        bike.sta = '';
        bike.stl = '';
        bike.stemLength = 100;
        bike.stemAngle = -6;
        bike.spacersHeight = 20;
        bike.handlebarReach = 80;
        bike.saddleSetback = 0;
        bike.saddleHeight = 0;
        
        // Reset dropdown menus if not a manual bike
        if (!bike.isManual) {
            bike.brand = '';
            bike.model = '';
            bike.size = '';
            
            const brandSelect = card.querySelector('.brand-select');
            const modelSelect = card.querySelector('.model-select');
            const sizeSelect = card.querySelector('.size-select');
            
            brandSelect.value = '';
            modelSelect.innerHTML = '<option value="">Select Model</option>';
            sizeSelect.innerHTML = '<option value="">Select Size</option>';
            modelSelect.disabled = true;
            sizeSelect.disabled = true;
        } else {
            // For manual bikes, clear all fields
            bike.brand = '';
            bike.model = '';
            bike.size = '';
            
            card.querySelector('.brand-input').value = '';
            card.querySelector('.model-input').value = '';
            card.querySelector('.size-input').value = '';
        }
        
        // Update input fields
        card.querySelector('.reach').value = bike.reach;
        card.querySelector('.stack').value = bike.stack;
        card.querySelector('.hta').value = bike.hta;
        card.querySelector('.sta').value = bike.sta;
        card.querySelector('.stl').value = bike.stl;
        card.querySelector('.stem-length').value = bike.stemLength;
        card.querySelector('.stem-angle').value = bike.stemAngle;
        card.querySelector('.spacer-height').value = bike.spacersHeight;
        
        // Clear results section
        card.querySelector('.handlebar-x').textContent = '-- mm';
        card.querySelector('.handlebar-y').textContent = '-- mm';
        card.querySelector('.bar-reach-needed').textContent = '-- mm';
        card.querySelector('.setback-sta').textContent = '-- mm';
        card.querySelector('.effective-sta').textContent = '-- °';
        card.querySelector('.bb-rail').textContent = '-- mm';
        card.querySelector('.exposed-seatpost').textContent = '-- mm';
        
        // Find the index of the bike in the array
        const bikeIndex = this.bikes.findIndex(b => b.id === bikeId);
        if (bikeIndex !== -1) {
            this.updateCalculationsForBike(bikeId);
            this.saveData(); // Save data after reset
        }
    }

    deleteBike(bikeId) {
        const bikeIndex = this.bikes.findIndex(b => b.id === bikeId);
        if (bikeIndex === -1) return;
        
        // Remove from DOM
        const card = document.getElementById(bikeId);
        if (card) {
            card.remove();
        }
        
        // Remove from array
        this.bikes.splice(bikeIndex, 1);
        this.saveData(); // Save data after deletion
    }

    duplicateBike(bikeId) {
        const originalBike = this.bikes.find(b => b.id === bikeId);
        if (!originalBike) return;

        // Create a deep copy of the bike data with a new ID
        const duplicatedBike = {
            ...JSON.parse(JSON.stringify(originalBike)),
            id: `bike-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        };

        // Find the index of the original bike
        const originalIndex = this.bikes.findIndex(b => b.id === bikeId);
        
        // Insert the duplicated bike after the original
        this.bikes.splice(originalIndex + 1, 0, duplicatedBike);
        
        // Render the new bike card
        this.renderBikeCard(duplicatedBike, originalIndex + 1);
        
        // Setup bike selectors if it's not a manual bike
        if (!duplicatedBike.isManual) {
            this.setupBikeSelectors(duplicatedBike.id);
        }
        
        // Update calculations and save
        this.updateCalculationsForBike(duplicatedBike.id);
        this.saveData();
    }

    async setupBikeSelectors(bikeId) {
        const card = document.getElementById(bikeId);
        const brandSelect = card.querySelector('.brand-select');
        const modelSelect = card.querySelector('.model-select');
        const sizeSelect = card.querySelector('.size-select');
        const bike = this.bikes.find(b => b.id === bikeId);

        // Populate brands
        const brands = await this.database.getBrands();
        brandSelect.innerHTML = '<option value="">Select Brand</option>';
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });

        // If we have saved brand data, restore it and its dependent selections
        if (bike.brand) {
            brandSelect.value = bike.brand;
            const models = await this.database.getModels(bike.brand);
            modelSelect.innerHTML = '<option value="">Select Model</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            modelSelect.disabled = false;

            if (bike.model) {
                modelSelect.value = bike.model;
                const sizes = await this.database.getSizes(bike.brand, bike.model);
                sizeSelect.innerHTML = '<option value="">Select Size</option>';
                sizes.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size;
                    option.textContent = size;
                    sizeSelect.appendChild(option);
                });
                sizeSelect.disabled = false;

                if (bike.size) {
                    sizeSelect.value = bike.size;
                }
            }
        }

        // Setup change handlers
        brandSelect.addEventListener('change', async () => {
            modelSelect.innerHTML = '<option value="">Select Model</option>';
            sizeSelect.innerHTML = '<option value="">Select Size</option>';
            
            if (brandSelect.value) {
                const models = await this.database.getModels(brandSelect.value);
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });
                modelSelect.disabled = false;
                sizeSelect.disabled = true;
            } else {
                modelSelect.disabled = true;
                sizeSelect.disabled = true;
            }
            this.updateBikeData(bikeId);
        });

        modelSelect.addEventListener('change', async () => {
            sizeSelect.innerHTML = '<option value="">Select Size</option>';
            
            if (modelSelect.value) {
                const sizes = await this.database.getSizes(brandSelect.value, modelSelect.value);
                sizes.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size;
                    option.textContent = size;
                    sizeSelect.appendChild(option);
                });
                sizeSelect.disabled = false;
            } else {
                sizeSelect.disabled = true;
            }
            this.updateBikeData(bikeId);
        });

        sizeSelect.addEventListener('change', async () => {
            if (sizeSelect.value) {
                const geometry = await this.database.getBikeGeometry(
                    brandSelect.value,
                    modelSelect.value,
                    sizeSelect.value
                );
                
                if (geometry) {
                    const bike = this.bikes.find(b => b.id === bikeId);
                    if (bike) {
                        // Update bike properties directly
                        bike.brand = brandSelect.value;
                        bike.model = modelSelect.value;
                        bike.size = sizeSelect.value;
                        bike.reach = geometry.reach;
                        bike.stack = geometry.stack;
                        bike.hta = geometry.hta;
                        bike.sta = geometry.sta;
                        bike.stl = geometry.stl;
                        
                        // Update display
                        card.querySelector('.reach').value = geometry.reach;
                        card.querySelector('.stack').value = geometry.stack;
                        card.querySelector('.hta').value = geometry.hta;
                        card.querySelector('.sta').value = geometry.sta;
                        card.querySelector('.stl').value = geometry.stl;
                        
                        // Update calculations for this bike only
                        this.updateCalculationsForBike(bikeId);
                        
                        // Save the updated data
                        this.saveData();
                    }
                }
            }
            this.updateBikeData(bikeId);
        });
    }

    saveData() {
        const data = {
            sessionTimestamp: sessionStorage.getItem('xyCalculatorSession'),
            clientName: document.getElementById('clientName').value,
            targetSaddleX: document.getElementById('targetSaddleX').value,
            targetSaddleY: document.getElementById('targetSaddleY').value,
            targetHandlebarX: document.getElementById('targetHandlebarX').value,
            targetHandlebarY: document.getElementById('targetHandlebarY').value,
            handlebarReachUsed: document.getElementById('handlebarReachUsed').value,
            bikes: this.bikes.map(bike => {
                // Create a deep copy of the bike object to ensure all properties are saved
                return {
                    ...bike,
                    // Ensure these properties are explicitly saved
                    reach: bike.reach || '',
                    stack: bike.stack || '',
                    hta: bike.hta || '',
                    sta: bike.sta || '',
                    stl: bike.stl || '',
                    stemLength: bike.stemLength || 100,
                    stemAngle: bike.stemAngle || -6,
                    spacersHeight: bike.spacersHeight || 20,
                    handlebarReach: bike.handlebarReach || 80,
                    saddleSetback: bike.saddleSetback || 0,
                    saddleHeight: bike.saddleHeight || 0
                };
            })
        };
        localStorage.setItem('xyCalculatorData', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('xyCalculatorData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Restore target positions
            document.getElementById('clientName').value = data.clientName || '';
            document.getElementById('targetSaddleX').value = data.targetSaddleX || '';
            document.getElementById('targetSaddleY').value = data.targetSaddleY || '';
            document.getElementById('targetHandlebarX').value = data.targetHandlebarX || '';
            document.getElementById('targetHandlebarY').value = data.targetHandlebarY || '';
            document.getElementById('handlebarReachUsed').value = data.handlebarReachUsed || '';
            
            // Enable/disable save button based on client name
            document.getElementById('saveButton').disabled = !data.clientName;

            // Restore bikes
            if (data.bikes && data.bikes.length > 0) {
                this.bikes = data.bikes;
                // Clear existing bike cards
                document.getElementById('bikes-container').innerHTML = '';
                // Render saved bikes
                this.bikes.forEach((bikeData, index) => {
                    this.renderBikeCard(bikeData, index);
                    
                    // Get the card element
                    const card = document.getElementById(bikeData.id);
                    
                    // Explicitly set the geometry values in the input fields
                    if (card) {
                        // Set geometry values
                        card.querySelector('.reach').value = bikeData.reach || '';
                        card.querySelector('.stack').value = bikeData.stack || '';
                        card.querySelector('.hta').value = bikeData.hta || '';
                        card.querySelector('.sta').value = bikeData.sta || '';
                        card.querySelector('.stl').value = bikeData.stl || '';
                        
                        // Set stem configuration values
                        card.querySelector('.stem-length').value = bikeData.stemLength || 100;
                        card.querySelector('.stem-angle').value = bikeData.stemAngle || -6;
                        card.querySelector('.spacer-height').value = bikeData.spacersHeight || 20;
                        
                        // For manual bikes, also set the brand/model/size
                        if (bikeData.isManual) {
                            const brandInput = card.querySelector('.brand-input');
                            const modelInput = card.querySelector('.model-input');
                            const sizeInput = card.querySelector('.size-input');
                            
                            if (brandInput) brandInput.value = bikeData.brand || '';
                            if (modelInput) modelInput.value = bikeData.model || '';
                            if (sizeInput) sizeInput.value = bikeData.size || '';
                        }
                    }
                    
                    if (!bikeData.isManual) {
                        this.setupBikeSelectors(bikeData.id);
                    }
                });
                this.updateCalculations();
            } else {
                // Add default bikes if no saved data
                for (let i = 0; i < 2; i++) {
                    this.addBike();
                }
                this.addManualBike();
            }
        } else {
            // Add default bikes if no saved data
            for (let i = 0; i < 2; i++) {
                this.addBike();
            }
            this.addManualBike();
        }
    }

    printBikeData() {
        // Check if there are any bikes to print
        if (this.bikes.length === 0) {
            this.showCustomAlert('No bike data to print.');
            return;
        }
        
        // Get client name
        const clientName = document.getElementById('clientName').value.trim() || 'Client';
        
        // Get target positions
        const targetSaddleX = document.getElementById('targetSaddleX').value || 'N/A';
        const targetSaddleY = document.getElementById('targetSaddleY').value || 'N/A';
        const targetHandlebarX = document.getElementById('targetHandlebarX').value || 'N/A';
        const targetHandlebarY = document.getElementById('targetHandlebarY').value || 'N/A';
        const handlebarReachUsed = document.getElementById('handlebarReachUsed').value || 'N/A';
        
        // Create a title for the print
        const title = document.createElement('div');
        title.innerHTML = `<h1 style="text-align: center; margin-bottom: 5px;">Bike Recommendations - ${clientName}</h1>
                          <p style="text-align: center; margin-bottom: 20px;">Generated on ${new Date().toLocaleDateString()}</p>`;
        
        // Create a temporary print container
        const printContainer = document.createElement('div');
        printContainer.className = 'print-container';
        printContainer.style.display = 'none';
        document.body.appendChild(printContainer);
        
        // Add the title
        printContainer.appendChild(title);
        
        // Add target positions section
        const targetSection = document.createElement('div');
        targetSection.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; text-align: center;">
                    <div>
                        <h3>Target Saddle</h3>
                        <p>X: ${targetSaddleX} mm</p>
                        <p>Y: ${targetSaddleY} mm</p>
                    </div>
                    <div>
                        <h3>Target Handlebar</h3>
                        <p>X: ${targetHandlebarX} mm</p>
                        <p>Y: ${targetHandlebarY} mm</p>
                    </div>
                    <div>
                        <h3>Bar Reach Used</h3>
                        <p>${handlebarReachUsed} mm</p>
                    </div>
                </div>
            </div>
        `;
        printContainer.appendChild(targetSection);
        
        // Add bike data section
        const bikesSection = document.createElement('div');
        
        // Get all bike cards with data
        const bikeCards = document.querySelectorAll('.bike-card');
        let hasBikeData = false;
        
        bikeCards.forEach((card, index) => {
            // Skip empty or placeholder cards
            if (card.classList.contains('bike-card-placeholder')) return;
            
            // Check if the card has the required geometry data (stack, reach, and head tube angle)
            const reachInput = card.querySelector('.reach');
            const stackInput = card.querySelector('.stack');
            const htaInput = card.querySelector('.hta');
            
            const hasReach = reachInput && reachInput.value && reachInput.value.trim() !== '';
            const hasStack = stackInput && stackInput.value && stackInput.value.trim() !== '';
            const hasHta = htaInput && htaInput.value && htaInput.value.trim() !== '';
            
            // Skip cards without required geometry
            if (!hasReach || !hasStack || !hasHta) return;
            
            // Get bike name - construct from brand, model, and size if available
            let bikeName = '';
            
            // For manual bikes, get values from input fields
            if (card.querySelector('.manual-inputs')) {
                const brandInput = card.querySelector('.brand-input');
                const modelInput = card.querySelector('.model-input');
                const sizeInput = card.querySelector('.size-input');
                
                const brand = brandInput && brandInput.value ? brandInput.value.trim() : '';
                const model = modelInput && modelInput.value ? modelInput.value.trim() : '';
                const size = sizeInput && sizeInput.value ? sizeInput.value.trim() : '';
                
                if (brand || model || size) {
                    bikeName = [brand, model, size].filter(Boolean).join(' ');
                    if (brand && (model || size)) {
                        bikeName = brand + ' ' + [model, size].filter(Boolean).join(' - ');
                    }
                }
            } 
            // For database bikes, get values from selectors
            else if (card.querySelector('.bike-selector')) {
                const brandSelect = card.querySelector('.brand-select');
                const modelSelect = card.querySelector('.model-select');
                const sizeSelect = card.querySelector('.size-select');
                
                const brand = brandSelect && brandSelect.value ? brandSelect.value : '';
                const model = modelSelect && modelSelect.value ? modelSelect.value : '';
                const size = sizeSelect && sizeSelect.value ? sizeSelect.value : '';
                
                if (brand || model || size) {
                    bikeName = [brand, model, size].filter(Boolean).join(' ');
                    if (brand && (model || size)) {
                        bikeName = brand + ' ' + [model, size].filter(Boolean).join(' - ');
                    }
                }
            }
            
            // If we couldn't construct a name, use a default
            if (!bikeName) {
                bikeName = `Bike ${index + 1}`;
            }
            
            // Get geometry data
            const geometrySection = card.querySelector('.geometry-section');
            let geometryData = '';
            if (geometrySection) {
                const geometryInputs = geometrySection.querySelectorAll('.input-group');
                geometryInputs.forEach(group => {
                    const label = group.querySelector('label')?.textContent || '';
                    const value = group.querySelector('input')?.value || 'N/A';
                    const unit = group.querySelector('span')?.textContent || '';
                    if (label && value) {
                        geometryData += `<p>${label} ${value}${unit}</p>`;
                    }
                });
            }
            
            // Get stem data
            const stemSection = card.querySelector('.stem-section');
            let stemData = '';
            if (stemSection) {
                const stemInputs = stemSection.querySelectorAll('.input-group');
                stemInputs.forEach(group => {
                    const label = group.querySelector('label')?.textContent || '';
                    const value = group.querySelector('input')?.value || 'N/A';
                    const unit = group.querySelector('span')?.textContent || '';
                    if (label && value) {
                        stemData += `<p>${label} ${value}${unit}</p>`;
                    }
                });
            }
            
            // Get results data
            const resultsSection = card.querySelector('.results-section');
            let resultsData = '';
            if (resultsSection) {
                const resultGroups = resultsSection.querySelectorAll('.result-group');
                resultGroups.forEach(group => {
                    const label = group.querySelector('label')?.textContent || '';
                    const valueSpan = group.querySelector('span');
                    const value = valueSpan?.textContent || 'N/A';
                    
                    // Special handling for handlebar X and Y to show differences with arrows
                    if (label === 'Handlebar X:' && targetHandlebarX && value !== '-- mm') {
                        const actualValue = parseInt(value);
                        if (!isNaN(actualValue)) {
                            const targetValue = parseInt(targetHandlebarX);
                            const diff = actualValue - targetValue;
                            
                            if (Math.abs(diff) >= 1) {
                                let diffText = '';
                                if (diff > 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #FF3B30;">→ ${diff}mm longer</span>`;
                                } else if (diff < 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #007AFF;">← ${Math.abs(diff)}mm shorter</span>`;
                                }
                                
                                resultsData += `<p>${label} ${actualValue} mm ${diffText}</p>`;
                            } else {
                                resultsData += `<p>${label} ${actualValue} mm</p>`;
                            }
                        } else {
                            resultsData += `<p>${label} ${value}</p>`;
                        }
                    } 
                    else if (label === 'Handlebar Y:' && targetHandlebarY && value !== '-- mm') {
                        const actualValue = parseInt(value);
                        if (!isNaN(actualValue)) {
                            const targetValue = parseInt(targetHandlebarY);
                            const diff = actualValue - targetValue;
                            
                            if (Math.abs(diff) >= 1) {
                                let diffText = '';
                                if (diff > 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #007AFF;">↑ ${diff}mm higher</span>`;
                                } else if (diff < 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #FF3B30;">↓ ${Math.abs(diff)}mm lower</span>`;
                                }
                                
                                resultsData += `<p>${label} ${actualValue} mm ${diffText}</p>`;
                            } else {
                                resultsData += `<p>${label} ${actualValue} mm</p>`;
                            }
                        } else {
                            resultsData += `<p>${label} ${value}</p>`;
                        }
                    }
                    else {
                        resultsData += `<p>${label} ${value}</p>`;
                    }
                });
            }
            
            // Only add cards that have some data
            if (geometryData || stemData || resultsData) {
                hasBikeData = true;
                
                // Create bike card for print
                const bikeCard = document.createElement('div');
                bikeCard.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; page-break-inside: avoid;';
                bikeCard.innerHTML = `
                    <h3 style="margin-bottom: 10px;">${bikeName}</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                        ${geometryData ? `
                            <div style="flex: 1; min-width: 200px;">
                                <h4 style="margin-bottom: 8px;">Geometry</h4>
                                ${geometryData}
                            </div>
                        ` : ''}
                        
                        ${stemData ? `
                            <div style="flex: 1; min-width: 200px;">
                                <h4 style="margin-bottom: 8px;">Stem</h4>
                                ${stemData}
                            </div>
                        ` : ''}
                        
                        ${resultsData ? `
                            <div style="flex: 1; min-width: 200px;">
                                <h4 style="margin-bottom: 8px;">Results</h4>
                                ${resultsData}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                bikesSection.appendChild(bikeCard);
            }
        });
        
        if (!hasBikeData) {
            bikesSection.innerHTML += '<p>No bike data available with complete geometry (stack, reach, and head tube angle).</p>';
        }
        
        printContainer.appendChild(bikesSection);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Write content to the new window
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>XY Bike Calculator - ${clientName}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.4;
                        color: #1C1C1E;
                        padding: 20px;
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    h1, h2, h3, h4 {
                        margin-top: 0;
                    }
                    p {
                        margin: 5px 0;
                    }
                    .print-button {
                        background-color: #5856D6;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                        margin: 20px auto;
                        display: block;
                    }
                    .print-button:hover {
                        opacity: 0.9;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .print-button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContainer.innerHTML}
                <button class="print-button" onclick="window.print()">Print Report</button>
            </body>
            </html>
        `);
        
        // Clean up
        document.body.removeChild(printContainer);
        
        // Close the document and focus the window
        printWindow.document.close();
        printWindow.focus();
    }

    saveInstance() {
        const clientName = document.getElementById('clientName').value.trim();
        if (!clientName) return;

        // Get bikes with calculated handlebar positions
        const validBikes = this.bikes.filter(bike => {
            const card = document.getElementById(bike.id);
            if (!card) return false;
            const handlebarX = card.querySelector('.handlebar-x').textContent;
            return handlebarX && handlebarX !== '-- mm';
        });

        if (validBikes.length === 0) {
            // Replace alert with custom dialog
            this.showCustomAlert('No bikes with calculated handlebar positions to save.');
            return;
        }

        const saveData = this.getSaveData();

        // Get existing saves from localStorage
        let savedInstances = JSON.parse(localStorage.getItem('savedBikeInstances') || '[]');
        
        // Add new save
        savedInstances.push(saveData);
        
        // Save back to localStorage
        localStorage.setItem('savedBikeInstances', JSON.stringify(savedInstances));
        
        // Replace alert with custom dialog
        this.showCustomAlert('Bike configuration saved successfully!');
    }

    // Method to get data for saving to Firebase
    getSaveData() {
        // Get bikes with calculated handlebar positions
        const validBikes = this.bikes.filter(bike => {
            const card = document.getElementById(bike.id);
            if (!card) return false;
            const handlebarX = card.querySelector('.handlebar-x').textContent;
            return handlebarX && handlebarX !== '-- mm';
        });

        return {
            timestamp: new Date().toISOString(),
            clientName: document.getElementById('clientName').value.trim(),
            targetSaddleX: document.getElementById('targetSaddleX').value,
            targetSaddleY: document.getElementById('targetSaddleY').value,
            targetHandlebarX: document.getElementById('targetHandlebarX').value,
            targetHandlebarY: document.getElementById('targetHandlebarY').value,
            handlebarReachUsed: document.getElementById('handlebarReachUsed').value,
            bikes: validBikes.map(bike => {
                const card = document.getElementById(bike.id);
                return {
                    ...bike,
                    calculatedValues: {
                        handlebarX: card.querySelector('.handlebar-x').textContent.split(' ')[0],
                        handlebarY: card.querySelector('.handlebar-y').textContent.split(' ')[0],
                        barReachNeeded: card.querySelector('.bar-reach-needed').textContent.split(' ')[0],
                        setbackSTA: card.querySelector('.setback-sta').textContent.split(' ')[0],
                        effectiveSTA: card.querySelector('.effective-sta').textContent.split(' ')[0],
                        bbToRail: card.querySelector('.bb-rail').textContent.split(' ')[0],
                        exposedSeatpost: card.querySelector('.exposed-seatpost').textContent.split(' ')[0]
                    }
                };
            })
        };
    }
    
    // Add a new method for custom alerts
    showCustomAlert(message) {
        // Check if there's already an alert dialog open
        if (document.querySelector('.alert-dialog')) {
            return; // Don't create multiple dialogs
        }
        
        // Create custom alert dialog
        const alertDialog = document.createElement('div');
        alertDialog.className = 'alert-dialog';
        alertDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg);
            color: var(--text-color);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            width: 90%;
            text-align: center;
            z-index: 1001;
        `;
        
        alertDialog.innerHTML = `
            <p style="margin-top: 0;">${message}</p>
            <div style="display: flex; justify-content: center; margin-top: 20px;">
                <button class="ok-button">OK</button>
            </div>
        `;
        
        // Create overlay
        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'alert-overlay';
        alertOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
        `;
        
        // Add to DOM
        document.body.appendChild(alertOverlay);
        document.body.appendChild(alertDialog);
        
        // Style button
        const okButton = alertDialog.querySelector('.ok-button');
        okButton.style.cssText = `
            padding: 8px 16px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        `;
        
        // Function to close the dialog
        const closeDialog = () => {
            if (document.body.contains(alertDialog)) {
                document.body.removeChild(alertDialog);
            }
            if (document.body.contains(alertOverlay)) {
                document.body.removeChild(alertOverlay);
            }
            // Remove the keyboard event listener
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        // Add event listener for the OK button
        okButton.onclick = closeDialog;
        
        // Handle keyboard events
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault(); // Prevent default action
                closeDialog();
            }
        };
        
        // Add keyboard event listener
        document.addEventListener('keydown', handleKeyDown);
        
        // Focus the OK button
        okButton.focus();
    }

    showLoadDialog() {
        // Get saved instances
        let savedInstances = JSON.parse(localStorage.getItem('savedBikeInstances') || '[]');
        
        if (savedInstances.length === 0) {
            this.showCustomAlert('No saved configurations found.');
            return;
        }

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'load-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg);
            color: var(--text-color);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            max-width: 900px;
            width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            z-index: 1000;
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'load-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        `;

        // Add header with title and close button
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'Load Saved Configuration';
        title.style.margin = '0';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            border: none;
            background: none;
            color: var(--text-color);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
        `;
        
        // Function to close the load dialog
        const closeLoadDialog = () => {
            if (document.body.contains(dialog)) {
                document.body.removeChild(dialog);
            }
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            // Remove keyboard event listener
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        closeButton.onclick = closeLoadDialog;
        
        header.appendChild(title);
        header.appendChild(closeButton);
        dialog.appendChild(header);

        // Add search input
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        `;
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search by client name...';
        searchInput.style.cssText = `
            flex-grow: 1;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            background: var(--input-bg);
            color: var(--text-color);
            font-size: 14px;
        `;
        
        searchContainer.appendChild(searchInput);
        dialog.appendChild(searchContainer);

        // Create table header
        const tableHeader = document.createElement('div');
        tableHeader.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 1.5fr 1fr 0.8fr 140px;
            gap: 10px;
            padding: 10px;
            background: var(--card-bg);
            border-bottom: 1px solid var(--border-color);
            font-weight: bold;
            text-align: left;
        `;
        tableHeader.innerHTML = `
            <div>Client Name</div>
            <div>Date</div>
            <div>Target Position</div>
            <div>Bikes</div>
            <div>Actions</div>
        `;
        dialog.appendChild(tableHeader);

        // Create scrollable container for items
        const itemsContainer = document.createElement('div');
        itemsContainer.style.cssText = `
            overflow-y: auto;
            flex-grow: 1;
        `;

        // Function to update the list
        const updateList = (searchTerm = '') => {
            const filteredInstances = savedInstances
                .filter(instance => {
                    if (!searchTerm) return true;
                    return instance.clientName.toLowerCase().startsWith(searchTerm.toLowerCase());
                })
                .sort((a, b) => a.clientName.toLowerCase().localeCompare(b.clientName.toLowerCase()));

            itemsContainer.innerHTML = '';
            
            filteredInstances.forEach(instance => {
                const item = document.createElement('div');
                item.style.cssText = `
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1fr 0.8fr 140px;
                    gap: 10px;
                    padding: 10px;
                    border-bottom: 1px solid var(--border-color);
                    align-items: center;
                `;
                
                // Remove hover effect CSS class and style tag
                item.className = '';
                
                const date = new Date(instance.timestamp);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                const targetPosition = instance.targetHandlebarX && instance.targetHandlebarY
                    ? `HX: ${instance.targetHandlebarX}, HY: ${instance.targetHandlebarY}`
                    : 'Not set';
                
                const validBikes = instance.bikes.filter(bike => 
                    bike.reach && bike.stack && bike.hta
                ).length;
                
                item.innerHTML = `
                    <div><strong>${instance.clientName}</strong></div>
                    <div>${formattedDate}</div>
                    <div>${targetPosition}</div>
                    <div>${validBikes} bike${validBikes !== 1 ? 's' : ''}</div>
                    <div style="display: flex; gap: 4px; justify-content: flex-start;">
                        <button class="load-button">Load</button>
                        <button class="delete-button">🗑️</button>
                    </div>
                `;

                const loadButton = item.querySelector('.load-button');
                loadButton.style.cssText = `
                    padding: 5px 10px;
                    background: transparent;
                    color: #007AFF;
                    border: 1px solid #007AFF;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    min-width: 60px;
                `;

                const deleteButton = item.querySelector('.delete-button');
                deleteButton.style.cssText = `
                    padding: 5px 10px;
                    background: transparent;
                    color: #8E8E93;
                    border: 1px solid #8E8E93;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    width: 32px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                loadButton.onclick = () => {
                    this.loadSavedInstance(instance);
                    closeLoadDialog();
                };

                deleteButton.onclick = () => {
                    console.log('Delete button clicked');
                    
                    // Create custom confirmation dialog
                    const confirmDialog = document.createElement('div');
                    confirmDialog.className = 'confirm-dialog';
                    confirmDialog.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: var(--card-bg);
                        color: var(--text-color);
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        max-width: 400px;
                        width: 90%;
                        text-align: center;
                        z-index: 1001;
                    `;
                    
                    confirmDialog.innerHTML = `
                        <h3 style="margin-top: 0;">Confirm Deletion</h3>
                        <p>Are you sure you want to delete this saved configuration?</p>
                        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                            <button class="cancel-button">Cancel</button>
                            <button class="confirm-button">Delete</button>
                        </div>
                    `;
                    
                    // Create overlay for confirmation dialog
                    const confirmOverlay = document.createElement('div');
                    confirmOverlay.className = 'confirm-dialog-overlay';
                    confirmOverlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 1000;
                    `;
                    
                    // Add to DOM
                    document.body.appendChild(confirmOverlay);
                    document.body.appendChild(confirmDialog);
                    
                    // Style buttons
                    const cancelButton = confirmDialog.querySelector('.cancel-button');
                    cancelButton.style.cssText = `
                        padding: 8px 16px;
                        background: transparent;
                        color: var(--text-color);
                        border: 1px solid var(--border-color);
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                    `;
                    
                    const confirmButton = confirmDialog.querySelector('.confirm-button');
                    confirmButton.style.cssText = `
                        padding: 8px 16px;
                        background: #FF3B30;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                    `;
                    
                    // Function to close the confirmation dialog
                    const closeConfirmDialog = () => {
                        if (document.body.contains(confirmDialog)) {
                            document.body.removeChild(confirmDialog);
                        }
                        if (document.body.contains(confirmOverlay)) {
                            document.body.removeChild(confirmOverlay);
                        }
                        // Remove keyboard event listener
                        document.removeEventListener('keydown', handleConfirmKeyDown);
                    };
                    
                    // Handle keyboard events for confirmation dialog
                    const handleConfirmKeyDown = (e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            closeConfirmDialog();
                            console.log('Delete cancelled via Escape key');
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            // Perform delete operation
                            console.log('Delete confirmed via Enter key');
                            const updatedInstances = savedInstances.filter(saved => 
                                saved.timestamp !== instance.timestamp
                            );
                            console.log('Original instances:', savedInstances.length);
                            console.log('Updated instances:', updatedInstances.length);
                            localStorage.setItem('savedBikeInstances', JSON.stringify(updatedInstances));
                            
                            // Update the local savedInstances array to match localStorage
                            savedInstances = updatedInstances;
                            
                            // Remove the item from the display
                            item.remove();
                            console.log('Item removed from display');
                            
                            closeConfirmDialog();
                            
                            // If no items left, close the main dialog
                            console.log('Items remaining:', itemsContainer.children.length);
                            if (itemsContainer.children.length === 0) {
                                closeLoadDialog();
                                console.log('Dialog closed - no items left');
                            }
                        }
                    };
                    
                    // Add keyboard event listener for confirmation dialog
                    document.addEventListener('keydown', handleConfirmKeyDown);
                    
                    // Add event listeners
                    cancelButton.onclick = () => {
                        closeConfirmDialog();
                        console.log('Delete cancelled');
                    };
                    
                    confirmButton.onclick = () => {
                        console.log('Delete confirmed');
                        const updatedInstances = savedInstances.filter(saved => 
                            saved.timestamp !== instance.timestamp
                        );
                        console.log('Original instances:', savedInstances.length);
                        console.log('Updated instances:', updatedInstances.length);
                        localStorage.setItem('savedBikeInstances', JSON.stringify(updatedInstances));
                        
                        // Update the local savedInstances array to match localStorage
                        savedInstances = updatedInstances;
                        
                        // Remove the item from the display
                        item.remove();
                        console.log('Item removed from display');
                        
                        closeConfirmDialog();
                        
                        // If no items left, close the main dialog
                        console.log('Items remaining:', itemsContainer.children.length);
                        if (itemsContainer.children.length === 0) {
                            closeLoadDialog();
                            console.log('Dialog closed - no items left');
                        }
                    };
                    
                    // Focus the cancel button by default (safer option)
                    cancelButton.focus();
                };

                itemsContainer.appendChild(item);
            });
        };

        // Add event listener for search input
        searchInput.addEventListener('input', (e) => {
            updateList(e.target.value);
        });
        
        // Handle keyboard events for load dialog
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeLoadDialog();
            }
        };
        
        // Add keyboard event listener
        document.addEventListener('keydown', handleKeyDown);

        dialog.appendChild(itemsContainer);
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // Initial list population
        updateList();
        
        // Focus the search input
        searchInput.focus();
    }

    loadSavedInstance(savedData) {
        // Set client name and target positions
        document.getElementById('clientName').value = savedData.clientName;
        document.getElementById('targetSaddleX').value = savedData.targetSaddleX;
        document.getElementById('targetSaddleY').value = savedData.targetSaddleY;
        document.getElementById('targetHandlebarX').value = savedData.targetHandlebarX;
        document.getElementById('targetHandlebarY').value = savedData.targetHandlebarY;
        document.getElementById('handlebarReachUsed').value = savedData.handlebarReachUsed;

        // Clear existing bikes
        document.getElementById('bikes-container').innerHTML = '';
        this.bikes = [];

        // Load saved bikes
        savedData.bikes.forEach((bikeData, index) => {
            this.bikes.push(bikeData);
            this.renderBikeCard(bikeData, index);
            
            const card = document.getElementById(bikeData.id);
            if (card) {
                // Set geometry values
                card.querySelector('.reach').value = bikeData.reach || '';
                card.querySelector('.stack').value = bikeData.stack || '';
                card.querySelector('.hta').value = bikeData.hta || '';
                card.querySelector('.sta').value = bikeData.sta || '';
                card.querySelector('.stl').value = bikeData.stl || '';
                
                // Set stem configuration values
                card.querySelector('.stem-length').value = bikeData.stemLength || 100;
                card.querySelector('.stem-angle').value = bikeData.stemAngle || -6;
                card.querySelector('.spacer-height').value = bikeData.spacersHeight || 20;
                
                // For manual bikes, set the brand/model/size
                if (bikeData.isManual) {
                    const brandInput = card.querySelector('.brand-input');
                    const modelInput = card.querySelector('.model-input');
                    const sizeInput = card.querySelector('.size-input');
                    
                    if (brandInput) brandInput.value = bikeData.brand || '';
                    if (modelInput) modelInput.value = bikeData.model || '';
                    if (sizeInput) sizeInput.value = bikeData.size || '';
                } else {
                    this.setupBikeSelectors(bikeData.id);
                }
            }
        });

        // Update calculations
        this.updateCalculations();
        
        // Enable save button
        document.getElementById('saveButton').disabled = false;
    }

    // Method to load a saved fit from Firebase
    loadSavedFit(savedData) {
        if (!savedData) return;

        // Set client name and target positions
        document.getElementById('clientName').value = savedData.clientName || '';
        document.getElementById('targetSaddleX').value = savedData.targetSaddleX || '';
        document.getElementById('targetSaddleY').value = savedData.targetSaddleY || '';
        document.getElementById('targetHandlebarX').value = savedData.targetHandlebarX || '';
        document.getElementById('targetHandlebarY').value = savedData.targetHandlebarY || '';
        document.getElementById('handlebarReachUsed').value = savedData.handlebarReachUsed || '';

        // Clear existing bikes
        document.getElementById('bikes-container').innerHTML = '';
        this.bikes = [];

        // Load saved bikes
        if (savedData.bikes && Array.isArray(savedData.bikes)) {
            savedData.bikes.forEach((bikeData, index) => {
                this.bikes.push(bikeData);
                this.renderBikeCard(bikeData, index);
                
                const card = document.getElementById(bikeData.id);
                if (card) {
                    // Set geometry values
                    card.querySelector('.reach').value = bikeData.reach || '';
                    card.querySelector('.stack').value = bikeData.stack || '';
                    card.querySelector('.hta').value = bikeData.hta || '';
                    card.querySelector('.sta').value = bikeData.sta || '';
                    card.querySelector('.stl').value = bikeData.stl || '';
                    
                    // Set stem configuration values
                    card.querySelector('.stem-length').value = bikeData.stemLength || 100;
                    card.querySelector('.stem-angle').value = bikeData.stemAngle || -6;
                    card.querySelector('.spacer-height').value = bikeData.spacersHeight || 20;
                    
                    // For manual bikes, set the brand/model/size
                    if (bikeData.isManual) {
                        const brandInput = card.querySelector('.brand-input');
                        const modelInput = card.querySelector('.model-input');
                        const sizeInput = card.querySelector('.size-input');
                        
                        if (brandInput) brandInput.value = bikeData.brand || '';
                        if (modelInput) modelInput.value = bikeData.model || '';
                        if (sizeInput) sizeInput.value = bikeData.size || '';
                    } else {
                        this.setupBikeSelectors(bikeData.id);
                    }
                }
            });
        }

        // Update calculations
        this.updateCalculations();
        
        // Enable save button
        document.getElementById('saveButton').disabled = false;
    }
}

class BikeDatabase {
    constructor() {
        this.API_KEY = 'AIzaSyBoHxCzT5MxcfMwp0-SBxBR95yGYyxYf7E';
        this.SPREADSHEET_ID = '1MBOgylql47RC_7KScV4f_avVicEqPrBt5HoC3nMBiTE';
        this.bikeData = null;
    }

    async initialize() {
        try {
            await this.loadBikeData();
        } catch (error) {
            console.error('Failed to initialize bike database:', error);
        }
    }

    async loadBikeData() {
        const range = 'A1:I2000';  // Adjust range to include all necessary columns
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${range}?key=${this.API_KEY}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch bike data');
            }
            const data = await response.json();
            this.bikeData = this.processSheetData(data.values);
        } catch (error) {
            console.error('Error loading bike data:', error);
            throw error;
        }
    }

    processSheetData(values) {
        if (!values || values.length < 2) return [];
        
        const headers = values[0];
        return values.slice(1).map(row => {
            const bike = {};
            headers.forEach((header, index) => {
                const value = row[index] || '';
                bike[header.toLowerCase().replace(/\s+/g, '_')] = value;
            });
            return bike;
        });
    }

    async getBrands() {
        if (!this.bikeData) await this.loadBikeData();
        return [...new Set(this.bikeData.map(bike => bike.brand))].sort();
    }

    async getModels(brand) {
        if (!this.bikeData) await this.loadBikeData();
        return [...new Set(this.bikeData
            .filter(bike => bike.brand === brand)
            .map(bike => bike.model))]
            .sort();
    }

    async getSizes(brand, model) {
        if (!this.bikeData) await this.loadBikeData();
        const bikes = this.bikeData
            .filter(bike => bike.brand === brand && bike.model === model)
            .sort((a, b) => parseFloat(a.stack) - parseFloat(b.stack));
        return [...new Set(bikes.map(bike => bike.size))];
    }

    async getBikeGeometry(brand, model, size) {
        if (!this.bikeData) await this.loadBikeData();
        const bike = this.bikeData.find(b => 
            b.brand === brand && 
            b.model === model && 
            b.size === size
        );
        
        if (!bike) return null;
        
        return {
            reach: parseFloat(bike.reach) || 0,
            stack: parseFloat(bike.stack) || 0,
            hta: parseFloat(bike.ht_angle) || 0,
            sta: parseFloat(bike.st_angle) || 0,
            stl: parseFloat(bike.st_length) || 0
        };
    }
}
        