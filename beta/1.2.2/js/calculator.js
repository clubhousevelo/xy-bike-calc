class BikeCalculator {
    constructor() {
        this.database = new BikeDatabase();
        this.bikes = [];
        this.bikeCount = 0;
        
        // Initialize database and event listeners
        this.initialize();
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
                // Start fresh with default bikes based on login status
                const isLoggedIn = firebase.auth().currentUser !== null;
                
                if (isLoggedIn) {
                    // For logged in users: one database bike and one manual bike
                    this.addBike(); // Add one database bike
                    this.addManualBike(); // Add one manual bike
                } else {
                    // For non-logged in users: a disabled database bike and one manual bike
                    this.addDisabledBike(); // Add disabled database bike
                    this.addManualBike(); // Add one manual bike
                }
                
                // Set new session timestamp
                sessionStorage.setItem('xyCalculatorSession', Date.now().toString());
            }
            
            // Adjust bike container width after initial load
            this.adjustBikesContainerWidth();
        } catch (error) {
            console.error('Failed to initialize calculator:', error);
            this.showCustomAlert('Failed to load bike database. Please check your internet connection and try again.');
        }
    }

    initializeEventListeners() {
        // Add bike buttons
        const addBikeBtn = document.getElementById('addBike');
        addBikeBtn.addEventListener('click', () => this.addBike());
        addBikeBtn.title = "Login required to add bikes from database";
        
        // Update add bike button state based on login status
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                addBikeBtn.classList.remove('disabled-button');
                addBikeBtn.title = "Add a bike from our database";
                // Update Save button state
                const saveButton = document.getElementById('saveButton');
                saveButton.classList.remove('disabled-button');
                saveButton.title = "Save your bike fit profile";
                
                // Remove any disabled bike cards when user logs in
                this.removeDisabledBikeCards();
            } else {
                addBikeBtn.classList.add('disabled-button');
                addBikeBtn.title = "Login required to add bikes from database";
                // Update Save button state
                const saveButton = document.getElementById('saveButton');
                saveButton.classList.add('disabled-button');
                saveButton.title = "Login required to save your profile";
            }
            
            // Update save button enabled/disabled state
            this.updateSaveButtonState();
        });
        
        document.getElementById('addManualBike').addEventListener('click', () => this.addManualBike());

        // Print button
        document.getElementById('printButton').addEventListener('click', () => this.printBikeData());
        
        // Window resize listener for adjusting bike container
        window.addEventListener('resize', () => {
            this.adjustBikesContainerWidth();
        });

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
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
            `;
            
            // Add to DOM
            document.body.appendChild(overlay);
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
            
            // Function to close dialog
            const closeDialog = () => {
                    document.body.removeChild(confirmDialog);
                document.body.removeChild(overlay);
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
                document.getElementById('clientNotes').value = '';
                document.getElementById('targetSaddleX').value = '';
                document.getElementById('targetSaddleY').value = '';
                document.getElementById('targetHandlebarX').value = '';
                document.getElementById('targetHandlebarY').value = '';
                document.getElementById('handlebarReachUsed').value = '';
                
                // Clear bikes container
                document.getElementById('bikes-container').innerHTML = '';
                this.bikes = [];
                
                // Add default bikes based on login status
                const isLoggedIn = firebase.auth().currentUser !== null;
                
                if (isLoggedIn) {
                    // For logged in users: one database bike and one manual bike
                    this.addBike(); // Add one database bike
                    this.addManualBike(); // Add one manual bike
                } else {
                    // For non-logged in users: a disabled database bike and one manual bike
                    this.addDisabledBike(); // Add disabled database bike
                    this.addManualBike(); // Add one manual bike
                }
                
                // Update save button state
                this.updateSaveButtonState();
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
            this.updateSaveButtonState();
            this.saveData();
        });

        // Save/Load buttons
        document.getElementById('saveButton').addEventListener('click', () => {
            // Check if user is logged in before allowing save
            if (!firebase.auth().currentUser) {
                this.showCustomAlert('Please log in to save bike configurations to a client profile.');
                return;
            }
            this.saveInstance();
        });
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
        
        // Fix dark mode toggle for XY Calculator
        const darkModeToggle = document.getElementById('darkModeToggle');
        const mobileDarkModeToggle = document.getElementById('mobileDarkModeToggle');
        
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                this.updateDarkModeToggle();
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            });
        }
        
        if (mobileDarkModeToggle) {
            mobileDarkModeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                this.updateDarkModeToggle();
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            });
        }
        
        // Update toggle state on initialization
        this.updateDarkModeToggle();
    }

    // Add method to update dark mode toggle appearance
    updateDarkModeToggle() {
        const darkModeToggles = [
            document.getElementById('darkModeToggle'),
            document.getElementById('mobileDarkModeToggle')
        ];
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        darkModeToggles.forEach(toggle => {
            if (toggle) {
                const toggleIcon = toggle.querySelector('.toggle-icon');
                const toggleText = toggle.querySelector('.toggle-text');
                
                if (toggleIcon) {
                    toggleIcon.textContent = isDarkMode ? '🌙' : '☀️';
                }
                
                if (toggleText) {
                    toggleText.textContent = isDarkMode ? 'Dark Mode' : 'Light Mode';
                }
            }
        });
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
        // Check if user is logged in when adding a non-manual bike (Google Sheets data)
        if (!firebase.auth().currentUser) {
            this.showCustomAlert('Please log in to access bikes from our database. You can still use "Manual Bikes" to input custom geometry numbers without logging in.');
            return;
        }
        
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
    
    addDisabledBike() {
        // Don't add disabled bike if user is already logged in
        if (firebase.auth().currentUser) {
            return;
        }
        
        const bikeData = {
            id: `disabled-bike-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            isManual: false,
            isDisabled: true,
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
        this.renderDisabledBikeCard(bikeData, this.bikes.length - 1);
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
        
        // Adjust container width based on number of cards
        this.adjustBikesContainerWidth();
    }
    
    renderDisabledBikeCard(bikeData, index) {
        const bikeCard = document.createElement('div');
        bikeCard.className = 'bike-card disabled-database-bike';
        bikeCard.id = bikeData.id;
        bikeCard.title = "Log in to use bikes from our database";
        
        // Use the same HTML structure as a regular database bike card
        bikeCard.innerHTML = this.getBikeCardHTML(index, false);
        
        // Add the disabled overlay
        const overlay = document.createElement('div');
        overlay.className = 'disabled-overlay';
        overlay.innerHTML = '<span class="login-prompt">Log in to configure bikes from database. You may still configure "Manual Bikes".</span>';
        bikeCard.appendChild(overlay);
        
        document.getElementById('bikes-container').appendChild(bikeCard);
        
        // Disable all inputs, selects, and buttons
        const inputs = bikeCard.querySelectorAll('input, select, button');
        inputs.forEach(input => {
            input.disabled = true;
            if (input.tagName === 'INPUT') {
                input.readOnly = true;
            }
        });
        
        // Make drag handle unclickable
        const dragHandle = bikeCard.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.classList.add('disabled');
            dragHandle.title = "Log in to enable this feature";
        }
        
        // Add empty options to selectors
        const selectors = bikeCard.querySelectorAll('select');
        selectors.forEach(selector => {
            // Clear any existing options
            while (selector.firstChild) {
                selector.removeChild(selector.firstChild);
            }
            
            // Add placeholder option
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            
            if (selector.classList.contains('brand-selector')) {
                placeholderOption.textContent = 'Select a brand';
            } else if (selector.classList.contains('model-selector')) {
                placeholderOption.textContent = 'Select a model';
            } else if (selector.classList.contains('size-selector')) {
                placeholderOption.textContent = 'Select a size';
            }
            
            selector.appendChild(placeholderOption);
        });
        
        // Adjust container width based on number of cards
        this.adjustBikesContainerWidth();
    }
    
    // Add this new method to dynamically adjust the bikes container width
    adjustBikesContainerWidth() {
        const bikesContainer = document.getElementById('bikes-container');
        const containerWrapper = document.querySelector('.bikes-container-wrapper');
        const bikeCards = document.querySelectorAll('.bike-card');
        
        if (bikeCards.length === 0) {
            containerWrapper.style.justifyContent = 'center';
            return;
        }
        
        // Calculate total width of all bike cards
        let totalCardsWidth = 0;
        
        // Get the computed gap between cards
        const computedStyle = window.getComputedStyle(bikesContainer);
        const gap = parseInt(computedStyle.gap) || 12; // Default to 12px if gap can't be determined
        
        // Calculate actual width by measuring each card
        bikeCards.forEach((card, index) => {
            totalCardsWidth += card.offsetWidth;
            // Add gap width for all but the last card
            if (index < bikeCards.length - 1) {
                totalCardsWidth += gap;
            }
        });
        
        // Compare with container width
        const containerWidth = containerWrapper.clientWidth;
        
        if (totalCardsWidth <= containerWidth - 24) { // 24px accounts for padding
            // Cards fit within container - center them
            containerWrapper.style.justifyContent = 'center';
        } else {
            // Cards overflow - align to left to enable scrolling
            containerWrapper.style.justifyContent = 'flex-start';
        }
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
                    <input type="number" class="stem-length" value="100" min="0" step="5">
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
        const stemHeightValue = card.querySelector('.stem-height').value;
        
        bike.stemLength = stemLengthValue === '' ? 0 : parseFloat(stemLengthValue);
        bike.stemAngle = stemAngleValue === '' ? 0 : parseFloat(stemAngleValue);
        bike.spacersHeight = spacerHeightValue === '' ? 0 : parseFloat(spacerHeightValue);
        bike.stemHeight = stemHeightValue === '' ? 40 : parseFloat(stemHeightValue);
        
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
            
            // Use stemHeight/2 instead of fixed 20mm value
            const stemHeight = bike.stemHeight !== undefined && bike.stemHeight !== '' ? bike.stemHeight / 2 : 20;
            const stemCenterX = (spacersHeight + stemHeight) * Math.cos(htaRad);
            const stemCenterY = (spacersHeight + stemHeight) * Math.sin(htaRad);
            
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
        bike.stemHeight = 40; // Default stem height
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
        card.querySelector('.stem-height').value = bike.stemHeight;
        
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
        
        // Adjust container width after removing a bike card
        this.adjustBikesContainerWidth();
    }

    duplicateBike(bikeId) {
        const originalBike = this.bikes.find(b => b.id === bikeId);
        if (!originalBike) return;

        // Check if trying to duplicate a non-manual bike while not logged in
        if (!originalBike.isManual && !firebase.auth().currentUser) {
            this.showCustomAlert('Please log in to duplicate bikes from our database. You can duplicate bikes with manually input geometry data without logging in.');
            return;
        }

        // Create a deep copy of the bike data with a new ID
        const duplicatedBike = {
            ...JSON.parse(JSON.stringify(originalBike)),
            id: `bike-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        };
        
        // For non-logged in users, ensure duplicated bikes are manual
        if (!firebase.auth().currentUser && !duplicatedBike.isManual) {
            duplicatedBike.isManual = true;
            duplicatedBike.id = `manual-bike-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Find the index of the original bike
        const originalIndex = this.bikes.findIndex(b => b.id === bikeId);
        
        // Insert the duplicated bike after the original
        this.bikes.splice(originalIndex + 1, 0, duplicatedBike);
        
        // Render the new bike card
        this.renderBikeCard(duplicatedBike, originalIndex + 1);
        
        // Set values in the duplicated bike card
        const card = document.getElementById(duplicatedBike.id);
        if (card) {
            // Set geometry values
            card.querySelector('.reach').value = duplicatedBike.reach || '';
            card.querySelector('.stack').value = duplicatedBike.stack || '';
            card.querySelector('.hta').value = duplicatedBike.hta || '';
            card.querySelector('.sta').value = duplicatedBike.sta || '';
            card.querySelector('.stl').value = duplicatedBike.stl || '';
            
            // Set stem configuration values
            card.querySelector('.stem-length').value = duplicatedBike.stemLength || 100;
            card.querySelector('.stem-angle').value = duplicatedBike.stemAngle || -6;
            card.querySelector('.spacer-height').value = duplicatedBike.spacersHeight || 20;
            
            // For manual bikes, set the brand/model/size
            if (duplicatedBike.isManual) {
                const brandInput = card.querySelector('.brand-input');
                const modelInput = card.querySelector('.model-input');
                const sizeInput = card.querySelector('.size-input');
                
                if (brandInput) brandInput.value = duplicatedBike.brand || '';
                if (modelInput) modelInput.value = duplicatedBike.model || '';
                if (sizeInput) sizeInput.value = duplicatedBike.size || '';
            } else {
            this.setupBikeSelectors(duplicatedBike.id);
            }
        }
        
        // Update calculations and save
        this.updateCalculationsForBike(duplicatedBike.id);
        this.saveData();
    }

    async setupBikeSelectors(bikeId) {
        // Check if user is logged in before loading data from Google Sheets
        if (!firebase.auth().currentUser) {
            const card = document.getElementById(bikeId);
            if (card) {
                // Replace the bike selector with a message about login
                const selectorContainer = card.querySelector('.bike-selector');
                if (selectorContainer) {
                    selectorContainer.innerHTML = `
                        <div style="padding: 10px; text-align: center; color: var(--text-secondary);">
                            <p>🔒 Login required to access bike database</p>
                            <button onclick="window.location.href='login.html'" style="margin-top: 10px;">
                                Login / Sign Up
                            </button>
                        </div>
                    `;
                }
            }
            return;
        }

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
            clientNotes: document.getElementById('clientNotes').value,
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
            try {
            const data = JSON.parse(savedData);
            
                // Clear existing bikes
                document.getElementById('bikes-container').innerHTML = '';
                this.bikes = [];
                
                // Set target positions
            document.getElementById('clientName').value = data.clientName || '';
            document.getElementById('targetSaddleX').value = data.targetSaddleX || '';
            document.getElementById('targetSaddleY').value = data.targetSaddleY || '';
            document.getElementById('targetHandlebarX').value = data.targetHandlebarX || '';
            document.getElementById('targetHandlebarY').value = data.targetHandlebarY || '';
            document.getElementById('handlebarReachUsed').value = data.handlebarReachUsed || '';
            
                // Check if user is logged in
                const isLoggedIn = firebase.auth().currentUser !== null;
                
                // Load bikes
                if (data.bikes && Array.isArray(data.bikes)) {
                    // If user is not logged in, filter out non-manual bikes
                    const bikesToLoad = isLoggedIn ? data.bikes : data.bikes.filter(bike => bike.isManual);
                    
                    // If no bikes remain after filtering, add default bikes based on login status
                    if (bikesToLoad.length === 0) {
                        if (isLoggedIn) {
                            // For logged in users: one database bike and one manual bike
                            this.addBike();
                            this.addManualBike();
                        } else {
                            // For non-logged in users: a disabled database bike and one manual bike
                            this.addDisabledBike(); // Add disabled database bike
                            this.addManualBike(); // Add one manual bike
                        }
                    } else {
                        bikesToLoad.forEach((bikeData, index) => {
                            this.bikes.push(bikeData);
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
                    
                            if (!bikeData.isManual && isLoggedIn) {
                        this.setupBikeSelectors(bikeData.id);
                    }
                });
                    }
                    
                this.updateCalculations();
            } else {
                    // No saved bikes, add defaults based on login status
                    const isLoggedIn = firebase.auth().currentUser !== null;
                    
                    if (isLoggedIn) {
                        // For logged in users: one database bike and one manual bike
                    this.addBike();
                this.addManualBike();
        } else {
                        // For non-logged in users: a disabled database bike and one manual bike
                        this.addDisabledBike(); // Add disabled database bike
                        this.addManualBike(); // Add one manual bike
                    }
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
                // In case of error, add default bikes based on login status
                const isLoggedIn = firebase.auth().currentUser !== null;
                
                if (isLoggedIn) {
                    // For logged in users: one database bike and one manual bike
                    this.addBike();
            this.addManualBike();
                } else {
                    // For non-logged in users: a disabled database bike and one manual bike
                    this.addDisabledBike(); // Add disabled database bike
                    this.addManualBike(); // Add one manual bike
                }
            }
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
        
        // Check if any target positions are provided
        const hasTargetPositions = 
            targetSaddleX !== 'N/A' || 
            targetSaddleY !== 'N/A' || 
            targetHandlebarX !== 'N/A' || 
            targetHandlebarY !== 'N/A' || 
            handlebarReachUsed !== 'N/A';
        
        // Get user's name from Firebase auth
        const user = firebase.auth().currentUser;
        let byLine = '';
        if (!user) {
            byLine = ' by Anonymous';
        } else if (user.displayName) {
            byLine = ` by ${user.displayName}`;
        }
        // The byLine will be empty if user is logged in but has no display name
        
        // Create a title for the print
        const title = document.createElement('div');
        title.innerHTML = `<h1 style="text-align: center; margin-bottom: 5px;">Bike Recommendations for ${clientName}</h1>
                          <p style="text-align: center; margin-bottom: 20px;">Generated on ${new Date().toLocaleDateString()}${byLine}</p>`;
        
        // Create a temporary print container
        const printContainer = document.createElement('div');
        printContainer.className = 'print-container';
        printContainer.style.display = 'none';
        document.body.appendChild(printContainer);
        
        // Add print-specific styles
        const printStyles = document.createElement('style');
        printStyles.textContent = `
            @media print {
                .print-container {
                    width: 80%;
                }
            }
        `;
        document.head.appendChild(printStyles);
        
        // Add the title
        printContainer.appendChild(title);
        
        // Add target positions section only if any target positions are provided
        if (hasTargetPositions) {
        const targetSection = document.createElement('div');
        targetSection.innerHTML = `
                <div style="margin-bottom: 12px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; text-align: center;">
                    <div>
                            <h4 style="margin: 0 0 4px 0;">Target Saddle</h4>
                            <div style="display: grid; grid-template-columns: 0.5fr 1fr; gap: 2px 2px;">
                                <div style="text-align: left; font-size: 15px;">X:</div>
                                <div style="text-align: right; font-size: 15px; font-weight: 600;">${targetSaddleX} mm</div>
                                <div style="text-align: left; font-size: 15px;">Y:</div>
                                <div style="text-align: right; font-size: 15px; font-weight: 600;">${targetSaddleY} mm</div>
                            </div>
                    </div>
                    <div>
                            <h4 style="margin: 0 0 4px 0;">Target Handlebar</h4>
                            <div style="display: grid; grid-template-columns: 0.5fr 1fr; gap: 2px 2px;">
                                <div style="text-align: left; font-size: 15px;">X:</div>
                                <div style="text-align: right; font-size: 15px; font-weight: 600;">${targetHandlebarX} mm</div>
                                <div style="text-align: left; font-size: 15px;">Y:</div>
                                <div style="text-align: right; font-size: 15px; font-weight: 600;">${targetHandlebarY} mm</div>
                            </div>
                    </div>
                    <div>
                            <h4 style="margin: 0 0 4px 0;">Bar Reach Used</h4>
                            <div style="display: grid; grid-template-columns: 0.5fr 1fr; gap: 2px 2px;">
                                <div style="text-align: left; font-size: 15px;">Length:</div>
                                <div style="text-align: right; font-size: 15px; font-weight: 600;">${handlebarReachUsed} mm</div>
                            </div>
                    </div>
                </div>
            </div>
        `;
        printContainer.appendChild(targetSection);
        }
        
        // Add bike data section
        const bikesSection = document.createElement('div');
        bikesSection.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start;';
        
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
            let isManual = false;
            
            // For manual bikes, get values from input fields
            if (card.querySelector('.manual-inputs')) {
                isManual = true;
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
                geometryData = '<div style="display: grid; grid-template-columns: 1fr 0.5fr; gap: 4px 2px;">';
                const geometryInputs = geometrySection.querySelectorAll('.input-group');
                geometryInputs.forEach(group => {
                    const label = group.querySelector('label')?.textContent || '';
                    const value = group.querySelector('input')?.value || 'N/A';
                    const unit = group.querySelector('span')?.textContent || '';
                    if (label && value) {
                        geometryData += `
                            <div style="text-align: left; font-size: 13px;">${label}</div>
                            <div style="text-align: right; font-size: 13px; font-weight: 500;">${value}${unit}</div>
                        `;
                    }
                });
                geometryData += '</div>';
            }
            
            // Get stem data
            const stemSection = card.querySelector('.stem-section');
            let stemData = '';
            if (stemSection) {
                stemData = '<div style="display: grid; grid-template-columns: 1fr 0.5fr; gap: 4px 2px;">';
                const stemInputs = stemSection.querySelectorAll('.input-group');
                stemInputs.forEach(group => {
                    const label = group.querySelector('label')?.textContent || '';
                    const value = group.querySelector('input')?.value || 'N/A';
                    const unit = group.querySelector('span')?.textContent || '';
                    if (label && value) {
                        stemData += `
                            <div style="text-align: left; font-size: 13px;">${label}</div>
                            <div style="text-align: right; font-size: 13px; font-weight: 500;">${value}${unit}</div>
                        `;
                    }
                });
                stemData += '</div>';
            }
            
            // Get results data
            const resultsSection = card.querySelector('.results-section');
            let resultsData = '';
            if (resultsSection) {
                    resultsData = '<div style="display: grid; grid-template-columns: 1fr 0.7fr; gap: 4px 2px;">';
                const resultGroups = resultsSection.querySelectorAll('.result-group');
                resultGroups.forEach(group => {
                    const label = group.querySelector('label')?.textContent || '';
                    const valueSpan = group.querySelector('span');
                    const value = valueSpan?.textContent || 'N/A';
                    
                    // Special handling for handlebar X and Y to show differences with arrows
                    if (label === 'Handlebar X:' && targetHandlebarX !== 'N/A' && value !== '-- mm') {
                        const actualValue = parseInt(value);
                        if (!isNaN(actualValue)) {
                            const targetValue = parseInt(targetHandlebarX);
                            const diff = actualValue - targetValue;
                            
                            if (Math.abs(diff) >= 1) {
                                let diffText = '';
                                if (diff > 0) {
                                    diffText = `<div style="text-align: right; font-size: 12px; color: #FF3B30;">→ ${diff}mm longer</div>`;
                                } else if (diff < 0) {
                                    diffText = `<div style="text-align: right; font-size: 12px; color: #007AFF;">← ${Math.abs(diff)}mm shorter</div>`;
                                }
                                
                                resultsData += `
                                    <div style="text-align: left; font-size: 13px;">${label}</div>
                                    <div style="text-align: right; font-size: 14px; font-weight: 600;">${actualValue} mm</div>
                                    <div></div>${diffText}
                                `;
                            } else {
                                resultsData += `
                                    <div style="text-align: left; font-size: 13px;">${label}</div>
                                    <div style="text-align: right; font-size: 14px; font-weight: 600;">${actualValue} mm</div>
                                `;
                            }
                        } else {
                            resultsData += `
                                <div style="text-align: left; font-size: 13px;">${label}</div>
                                <div style="text-align: right; font-size: 14px; font-weight: 600;">${value}</div>
                            `;
                        }
                    } 
                    else if (label === 'Handlebar Y:' && targetHandlebarY !== 'N/A' && value !== '-- mm') {
                        const actualValue = parseInt(value);
                        if (!isNaN(actualValue)) {
                            const targetValue = parseInt(targetHandlebarY);
                            const diff = actualValue - targetValue;
                            
                            if (Math.abs(diff) >= 1) {
                                let diffText = '';
                                if (diff > 0) {
                                    diffText = `<div style="text-align: right; font-size: 12px; color: #007AFF;">↑ ${diff}mm higher</div>`;
                                } else if (diff < 0) {
                                    diffText = `<div style="text-align: right; font-size: 12px; color: #FF3B30;">↓ ${Math.abs(diff)}mm lower</div>`;
                                }
                                
                                resultsData += `
                                    <div style="text-align: left; font-size: 13px;">${label}</div>
                                    <div style="text-align: right; font-size: 14px; font-weight: 600;">${actualValue} mm</div>
                                    <div></div>${diffText}
                                `;
                            } else {
                                resultsData += `
                                    <div style="text-align: left; font-size: 13px;">${label}</div>
                                    <div style="text-align: right; font-size: 14px; font-weight: 600;">${actualValue} mm</div>
                                `;
                            }
                        } else {
                            resultsData += `
                                <div style="text-align: left; font-size: 13px;">${label}</div>
                                <div style="text-align: right; font-size: 14px; font-weight: 600;">${value}</div>
                            `;
                        }
                    }
                    else {
                        // For all other result values
                        let fontSize = '14px';
                        let fontWeight = '500';
                        
                        // Use larger fonts for position-related values
                        if (label.includes('Saddle') || label.includes('Handlebar')) {
                            fontSize = '15px';
                            fontWeight = '500';
                        }
                        
                        resultsData += `
                            <div style="text-align: left; font-size: 13px;">${label}</div>
                            <div style="text-align: right; font-size: ${fontSize}; font-weight: ${fontWeight};">${value}</div>
                        `;
                    }
                });
                resultsData += '</div>';
            }
            
            // Only add cards that have some data
            if (geometryData || stemData || resultsData) {
                hasBikeData = true;
                
                // Create bike card for print - using vertical column layout
                const bikeCard = document.createElement('div');
                bikeCard.style.cssText = 'width: 220px; margin-bottom: 12px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; page-break-inside: avoid; display: flex; flex-direction: column; background-color: #ffffff;';
                bikeCard.innerHTML = `
                    <h3 style="margin: 0 0 6px 0; font-size: 14px; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 6px;">${bikeName}</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${geometryData ? `
                            <div>
                                <h4 style="margin: 4px 0 4px 0; font-size: 13px; border-bottom: 1px solid #eee; padding-bottom: 2px;text-align: center;">Geometry</h4>
                                <div style="line-height: 1.2;">${geometryData}</div>
                            </div>
                        ` : ''}
                        
                        ${stemData ? `
                            <div>
                                <h4 style="margin: 4px 0 4px 0; font-size: 13px; border-bottom: 1px solid #eee; padding-bottom: 2px;text-align: center;">Stem</h4>
                                <div style="line-height: 1.2;">${stemData}</div>
                            </div>
                        ` : ''}
                        
                        ${resultsData ? `
                            <div>
                                <h4 style="margin: 4px 0 4px 0; font-size: 13px; border-bottom: 1px solid #eee; padding-bottom: 2px;text-align: center;">Results</h4>
                                <div style="line-height: 1.2;">${resultsData}</div>
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
                        max-width: 1200px;
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
                            margin: 0;
                            max-width: none;
                        }
                        .print-button {
                            display: none;
                        }
                        @page {
                            size: landscape;
                            margin: 0.5cm;
                        }
                        /* Force background colors to print */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
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
        // Client name should already be verified by the disabled state
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
            this.showCustomAlert('No bikes with calculated handlebar positions to save.');
            return;
        }

        // Save to Firebase
        window.saveUserData(this.getSaveData())
            .then(() => {
                // Use toast notification instead of alert dialog
                this.showToast('Bike configuration saved successfully!');
            })
            .catch(error => {
                // Still use alert for errors
                this.showCustomAlert('Error saving bike configuration: ' + error.message);
            });
    }

    // Add a method to update save button state based on auth
    updateSaveButtonState() {
        const saveButton = document.getElementById('saveButton');
        const clientName = document.getElementById('clientName')?.value?.trim();
        
        if (saveButton) {
            // Only disable if there's no client name
            saveButton.disabled = !clientName;
        }
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
            clientNotes: document.getElementById('clientNotes').value.trim(),
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
        // Store a reference to 'this' to use in nested functions
        const self = this;
        
        // Check if dialog already exists and remove it
        const existingDialog = document.getElementById('loadDialog');
        if (existingDialog) {
            document.body.removeChild(existingDialog);
        }

        // Check if overlay already exists and remove it
        const existingOverlay = document.getElementById('dialogOverlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        // Create dialog overlay
        const dialogOverlay = document.createElement('div');
        dialogOverlay.id = 'dialogOverlay';
        dialogOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create dialog
        const loadDialog = document.createElement('div');
        loadDialog.id = 'loadDialog';
        loadDialog.style.cssText = `
            background-color: var(--card-background);
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
            position: relative;
            z-index: 1001;
        `;

        // Create dialog content
        loadDialog.innerHTML = `
            <h2 style="margin-top: 0; color: var(--text-color);">Open Saved Bike Position</h2>
            <div style="margin-bottom: 16px;">
                <input type="text" id="searchInput" placeholder="Search by client name" style="
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--input-bg);
                    color: var(--text-color);
                ">
            </div>
            <div class="saved-fits-header" style="
                display: grid;
                grid-template-columns: 30px 2fr 1fr 1fr 1fr 100px;
                gap: 8px;
                padding: 8px;
                color: var(--text-color);
                font-weight: bold;
                margin-bottom: 10px;
            ">
                <div>
                    <input type="checkbox" id="selectAll" style="cursor: pointer;">
                </div>
                <div>Client Name</div>
                <div>Date Saved</div>
                <div>Bikes</div>
                <div>Target Position</div>
                <div>Actions</div>
            </div>
            <div id="savedFitsList" style="
                flex: 1;
                overflow-y: auto;
                margin-bottom: 12px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 8px;
                background: var(--background);
            "></div>
            <div style="display: flex; justify-content: space-between; gap: 8px; background: var(--background);">
                <div style="flex: 1;">
                    <button id="deleteSelected" class="delete-selected-button" style="
                        padding: 4px 10px;
                        background: transparent;
                        color: var(--error-color);
                        border: 1px solid var(--error-color);
                        border-radius: 4px;
                        cursor: pointer;
                        display: none;
                        transition: background-color 0.2s;
                    ">Delete Selected</button>
                </div>
                <div>
                    <button id="cancelLoad" style="
                        padding: 8px 16px;
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;

        // Add dialog to DOM - place the dialog inside the overlay
        dialogOverlay.appendChild(loadDialog);
        document.body.appendChild(dialogOverlay);

        // Get elements
        const searchInput = loadDialog.querySelector('#searchInput');
        const savedFitsList = loadDialog.querySelector('#savedFitsList');
        const cancelButton = loadDialog.querySelector('#cancelLoad');
        const selectAllCheckbox = loadDialog.querySelector('#selectAll');
        const deleteSelectedButton = loadDialog.querySelector('#deleteSelected');

        // Add styles for mobile layout
        const style = document.createElement('style');
        style.textContent = `
            .saved-fit-item {
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--card-bg);
                margin-bottom: 8px;
            }
            .saved-fit-item .client-name {
                font-weight: bold;
            }
            .saved-fit-item .action-buttons {
            display: flex;
                gap: 6px;
            }
            .saved-fit-item .load-btn {
                padding: 6px 12px;
                background: var(--primary-color);
                color: white;
            border: none;
                border-radius: 4px;
            cursor: pointer;
            }
            .saved-fit-item .delete-btn {
                padding: 6px;
                background: transparent;
                color: var(--error-color);
                border: 1px solid var(--error-color);
                border-radius: 4px;
                cursor: pointer;
                display: flex;
            align-items: center;
                justify-content: center;
            }
            @media (max-width: 767px) {
                .desktop-only {
                    display: none !important;
                }
                .saved-fit-item {
                    display: flex !important;
                    flex-direction: column !important;
                    padding: 8px !important;
                }
                .saved-fit-item .main-row {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    margin-bottom: 4px !important;
                }
                .saved-fit-item .info-row {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 8px !important;
                    font-size: 0.85em !important;
                    color: var(--text-secondary) !important;
                }
                .saved-fit-item .checkbox-container {
                    margin-right: 8px !important;
                }
                .saved-fit-item .client-name {
                    flex: 1 !important;
                }
                .saved-fit-item .date-info,
                .saved-fit-item .bikes-info,
                .saved-fit-item .position-info {
                    display: none !important;
                }
            }
            @media (min-width: 768px) {
                .saved-fit-item {
                    display: grid !important;
                    grid-template-columns: 30px 2fr 1fr 1fr 1fr 100px !important;
                    gap: 10px !important;
                    padding: 10px !important;
                    align-items: center !important;
                }
                .saved-fit-item .main-row,
                .saved-fit-item .info-row {
                    display: contents !important;
                }
                .saved-fit-item .info-row {
                    display: none !important;
                }
                .saved-fit-item .checkbox-container {
                    grid-column: 1;
                }
                .saved-fit-item .client-name {
                    grid-column: 2;
                }
                .saved-fit-item .date-info {
                    grid-column: 3;
                }
                .saved-fit-item .bikes-info {
                    grid-column: 4;
                }
                .saved-fit-item .position-info {
                    grid-column: 5;
                }
                .saved-fit-item .action-buttons {
                    grid-column: 6;
                }
            }
        `;
        document.head.appendChild(style);

        // Function to close dialog
        const closeLoadDialog = () => {
            document.body.removeChild(dialogOverlay);
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        // Handle keyboard events
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeLoadDialog();
            }
        };

        // Add keyboard event listener
        document.addEventListener('keydown', handleKeyDown);


        // Function to delete multiple fits
        const deleteMultipleFits = async (fitIds) => {
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    self.showToast('Please log in to delete bike positions', 'error');
                    return;
                }

                // Show a loading message in the list while deletion is in progress
                savedFitsList.innerHTML = '<div style="text-align: center; padding: 20px;">Deleting...</div>';
                
                // Disable all buttons in the dialog to prevent further actions
                const buttons = loadDialog.querySelectorAll('button');
                buttons.forEach(button => {
                    button.disabled = true;
                });

                const db = firebase.firestore();
                const batch = db.batch();

                fitIds.forEach(fitId => {
                    const fitRef = db.collection('users').doc(user.uid)
                        .collection('bikeFits').doc(fitId);
                    batch.delete(fitRef);
                });

                // Commit the batch delete operation
                await batch.commit();
                
                // Show success message
                self.showToast(`${fitIds.length} bike position(s) deleted successfully`);
                
                // Close current dialog
                closeLoadDialog();
                
                // Give Firestore some time to update
                setTimeout(() => {
                    // Reopen the dialog with a fresh state
                    self.showLoadDialog();
                }, 500);
                
            } catch (error) {
                console.error('Error deleting bike positions:', error);
                self.showToast('Error deleting bike position(s)', 'error');
                
                // Show error in list
                savedFitsList.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--error-color);">
                        Error deleting position(s). Please try again.
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <button id="retryLoadButton" style="
                            padding: 8px 16px;
                            background: var(--primary-color);
                            color: white;
            border: none;
                            border-radius: 4px;
            cursor: pointer;
                        ">Refresh List</button>
                    </div>
                `;
                
                // Re-enable buttons
                const buttons = loadDialog.querySelectorAll('button');
                buttons.forEach(button => {
                    if (button.id !== 'retryLoadButton') {
                        button.disabled = false;
                    }
                });
                
                // Add event listener to retry button
                const retryButton = document.getElementById('retryLoadButton');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        updateList(searchInput.value.trim());
                    });
                }
            }
        };

        // Function to update the selected state
        const updateSelectedState = () => {
            const checkboxes = savedFitsList.querySelectorAll('.fit-checkbox');
            const selectAllCheckbox = loadDialog.querySelector('#selectAll');
            const deleteSelectedButton = loadDialog.querySelector('.delete-selected-button');
            
            // Count selected checkboxes
            const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            // Update select all checkbox state
            if (selectAllCheckbox) {
                if (selectedCount === checkboxes.length && checkboxes.length > 0) {
                    selectAllCheckbox.checked = true;
                    selectAllCheckbox.indeterminate = false;
                } else if (selectedCount === 0) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                } else {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = true;
                }
            }
            
            // Show/hide delete selected button based on any selection
            if (deleteSelectedButton) {
                deleteSelectedButton.style.display = selectedCount > 0 ? 'block' : 'none';
            }
        };

        // Function to update the list with retry mechanism
        let allFits = []; // Store all fits to enable client-side searching
        
        const updateList = async (searchTerm = '', retryCount = 0, forceRefresh = false) => {
            const maxRetries = 3;
            
            // If we already have data and we're just searching (not forcing refresh), filter client-side
            if (allFits.length > 0 && !forceRefresh) {
                renderFitsList(searchTerm);
                return;
            }
            
            // Show loading indicator
            savedFitsList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';

            try {
                // Check if user is logged in
                const user = firebase.auth().currentUser;
                if (!user) {
                    savedFitsList.innerHTML = '<div style="text-align: center; padding: 20px;">Please log in to view saved clients and bike positions</div>';
                    return;
                }

                const db = firebase.firestore();
                
                // Add a retry backoff delay
                if (retryCount > 0) {
                    // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
                    const delay = Math.min(500 * Math.pow(2, retryCount - 1), 3000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                // Create a query with cache-first approach
                const fitsRef = db.collection('users').doc(user.uid).collection('bikeFits');
                let query = fitsRef.orderBy('timestamp', 'desc');
                
                // Set a timeout for the query
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timed out')), 10000)
                );
                
                // Try to get data with timeout protection
                let snapshot;
                try {
                    snapshot = await Promise.race([
                        query.get({ source: 'default' }), // Try cache first, then server
                        timeoutPromise
                    ]);
                } catch (err) {
                    console.warn(`Query attempt ${retryCount + 1} failed:`, err);
                    
                    // Retry with increased count if not at max retries
                    if (retryCount < maxRetries) {
                        return updateList(searchTerm, retryCount + 1, forceRefresh);
                    }
                    throw err; // Re-throw if max retries reached
                }

                // Handle empty results
                if (!snapshot || snapshot.empty) {
                    allFits = []; // Clear the cache
                    savedFitsList.innerHTML = '<div style="text-align: center; padding: 20px;">No saved bike positions found</div>';
                    return;
                }

                // Process the results
                allFits = []; // Reset the fits array before processing new data
                snapshot.forEach(doc => {
                    try {
                        const data = doc.data();
                        // Validate required fields before adding to list
                        if (data && data.clientName) {
                            allFits.push({
                                id: doc.id,
                                ...data
                            });
                        } else {
                            console.warn('Skipping invalid fit data:', doc.id);
                        }
                    } catch (error) {
                        console.error('Error processing fit data:', error);
                        // Continue with other fits even if one fails
                    }
                });

                // Render the list with the search term
                renderFitsList(searchTerm);
                
            } catch (error) {
                console.error('Error loading saved positions:', error);
                
                // Provide a more helpful error message based on the error type
                let errorMessage = 'Error loading saved positions';
                
                if (error.message === 'Request timed out') {
                    errorMessage = 'Loading timed out. Please try again.';
                } else if (error.code === 'permission-denied') {
                    errorMessage = 'You don\'t have permission to view these positions.';
                } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                    errorMessage = 'Network issue. Please check your connection and try again.';
                }
                
                // Only show retry button if not already retrying
                if (retryCount < maxRetries) {
                    savedFitsList.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: var(--error-color);">${errorMessage}</div>
                        <div style="text-align: center; margin-top: 10px;">
                            <button id="retryButton" style="
                                padding: 8px 16px;
                                background: var(--primary-color);
                                color: white;
                                border: none;
                    border-radius: 4px;
                    cursor: pointer;
                            ">Retry</button>
                        </div>
                    `;
                    
                    const retryButton = document.getElementById('retryButton');
                    if (retryButton) {
                        retryButton.addEventListener('click', () => {
                            updateList(searchTerm, retryCount + 1, true); // Force refresh on retry
                        });
                    }
                } else {
                    savedFitsList.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: var(--error-color);">
                            ${errorMessage}
                        </div>
                        <div style="text-align: center; margin-top: 10px;">
                            <p>Please try closing and reopening the dialog.</p>
                        </div>
                    `;
                }
            }
        };
        
        // Function to render the list with filtering
        const renderFitsList = (searchTerm = '') => {
            // Filter fits if there's a search term - handle case insensitively and safely
            const filteredFits = searchTerm
                ? allFits.filter(fit => {
                    try {
                        return fit.clientName && 
                            fit.clientName.toLowerCase().includes(searchTerm.toLowerCase());
                    } catch (err) {
                        console.warn('Error filtering fit:', err);
                        return false; // Skip items that cause errors
                    }
                })
                : allFits;

            // Handle no matches
            if (filteredFits.length === 0) {
                savedFitsList.innerHTML = searchTerm 
                    ? `<div style="text-align: center; padding: 20px;">No matches found for "${searchTerm}"</div>`
                    : '<div style="text-align: center; padding: 20px;">No saved bike positions found</div>';
                return;
            }

            // Build HTML for the list
            let html = '';
            
            // Process each fit individually to prevent one bad fit from breaking the entire list
            filteredFits.forEach(fit => {
                try {
                    const date = new Date(fit.timestamp || Date.now());
                    const formattedDate = date.toLocaleDateString();
                    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    // Safely get bike count
                    const bikeCount = fit.bikes && Array.isArray(fit.bikes) ? fit.bikes.length : 0;
                    
                    // Safely get target positions
                    const targetX = fit.targetHandlebarX || '--';
                    const targetY = fit.targetHandlebarY || '--';
                    
                    html += `
                    <div class="saved-fit-item" data-fit-id="${fit.id}">
                        <div class="main-row">
                            <div class="checkbox-container">
                                <input type="checkbox" class="fit-checkbox" style="cursor: pointer;">
                            </div>
                            <div class="client-name">
                                ${fit.clientName || 'Unnamed'}
                                ${fit.clientNotes ? `<div class="client-notes" style="font-size: 0.85em; color: var(--text-secondary); margin-top: 4px; font-weight: normal;">${fit.clientNotes}</div>` : ''}
                            </div>
                            <div class="date-info">${formattedDate}<br><span style="font-size: 0.9em; color: var(--text-secondary);">${formattedTime}</span></div>
                            <div class="bikes-info">${bikeCount} bikes</div>
                            <div class="position-info">HX: ${targetX}mm<br>HY: ${targetY}mm</div>
                            <div class="action-buttons">
                                <button class="load-btn">Open</button>
                                <button class="delete-btn">🗑️</button>
                            </div>
                        </div>
                        <div class="info-row">
                            <span>${formattedDate} ${formattedTime}</span>
                            <span>•</span>
                            <span>${bikeCount} bikes</span>
                            <span>•</span>
                            <span>HX: ${targetX}mm, HY: ${targetY}mm</span>
                            ${fit.clientNotes ? `<div style="width: 100%; display: block; margin-top: 5px; font-style: italic;">${fit.clientNotes}</div>` : ''}
                        </div>
                </div>
            `;
                } catch (itemError) {
                    console.error('Error rendering item:', itemError);
                    // Skip this item if it causes an error
                }
            });

            // Update the DOM
            savedFitsList.innerHTML = html || '<div style="text-align: center; padding: 20px;">No valid bike positions found</div>';

            // Add event listeners after DOM update
            try {
                // Add event listeners to checkboxes
                savedFitsList.querySelectorAll('.fit-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', updateSelectedState);
                });

                // Add event listeners to load buttons
                savedFitsList.querySelectorAll('.load-btn').forEach(button => {
                    button.addEventListener('click', async () => {
                        try {
                            const fitId = button.closest('.saved-fit-item').dataset.fitId;
                            if (!fitId) throw new Error('Missing fit ID');
                            
                            const user = firebase.auth().currentUser;
                            if (!user) throw new Error('User not logged in');

                            button.textContent = 'Opening...';
                            button.disabled = true;

                            // First try to find the data in our locally cached allFits array
                            const cachedFit = allFits.find(fit => fit.id === fitId);
                            if (cachedFit) {
                                self.loadSavedFit(cachedFit);
                    closeLoadDialog();
                                return;
                            }

                            // If not found in cache, fetch from Firestore
                            const doc = await firebase.firestore()
                                .collection('users')
                                .doc(user.uid)
                                .collection('bikeFits')
                                .doc(fitId)
                                .get();

                            if (doc.exists) {
                                self.loadSavedFit(doc.data());
                                closeLoadDialog();
                            } else {
                                throw new Error('Bike position not found');
                            }
                        } catch (error) {
                            console.error('Error loading bike position:', error);
                            self.showToast('Error loading bike position', 'error');
                            
                            // Reset button
                            button.textContent = 'Open';
                            button.disabled = false;
                        }
                    });
                });

                // Add delete handlers
                savedFitsList.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', async () => {
                        try {
                            const fitId = button.closest('.saved-fit-item').dataset.fitId;
                            if (fitId) {
                                showDeleteConfirmation([fitId], () => deleteMultipleFits([fitId]));
                            }
                        } catch (error) {
                            console.error('Error setting up delete handler:', error);
                        }
                    });
                });
            } catch (eventError) {
                console.error('Error setting up event listeners:', eventError);
            }
        };

        cancelButton.addEventListener('click', closeLoadDialog);

        // Select All checkbox handler
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = savedFitsList.querySelectorAll('.fit-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
            });
            updateSelectedState();
        });

        // Function to show custom confirmation dialog
        const showDeleteConfirmation = (fitIds, onConfirm) => {
            // Check if dialog already exists and remove it
            const existingDialog = document.querySelector('.confirm-dialog');
            if (existingDialog) {
                existingDialog.parentNode.removeChild(existingDialog);
            }

            // Check if overlay already exists and remove it
            const existingOverlay = document.querySelector('.dialog-overlay');
            if (existingOverlay) {
                document.body.removeChild(existingOverlay);
            }

                    const confirmDialog = document.createElement('div');
                    confirmDialog.className = 'confirm-dialog';
            confirmDialog.id = 'confirmDialog';
                    confirmDialog.style.cssText = `
                        background: var(--card-bg);
                        color: var(--text-color);
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        max-width: 400px;
                        width: 90%;
                        text-align: center;
                z-index: 1002;
                    `;
                    
            const message = fitIds.length === 1 
                ? 'Are you sure you want to delete this bike position?' 
                : `Are you sure you want to delete ${fitIds.length} selected bike positions?`;
                    
                    confirmDialog.innerHTML = `
                <h3 style="margin-top: 0;">Confirm Delete</h3>
                <p>${message}</p>
                        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                    <button class="cancel-button" style="
                        padding: 8px 16px;
                        background: transparent;
                        color: var(--text-color);
                        border: 1px solid var(--border-color);
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Cancel</button>
                    <button class="confirm-button" style="
                        padding: 8px 16px;
                        background: var(--error-color);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Delete</button>
                </div>
            `;

            // Create overlay
            const confirmOverlay = document.createElement('div');
            confirmOverlay.className = 'dialog-overlay';
            confirmOverlay.id = 'confirmOverlay';
            confirmOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1001;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            // Add to DOM - place dialog inside overlay
            confirmOverlay.appendChild(confirmDialog);
            document.body.appendChild(confirmOverlay);

            // Handle close
                    const closeConfirmDialog = () => {
                            document.body.removeChild(confirmOverlay);
            };
                    
                    // Add event listeners
            confirmDialog.querySelector('.cancel-button').onclick = closeConfirmDialog;
            confirmDialog.querySelector('.confirm-button').onclick = () => {
                onConfirm();
                        closeConfirmDialog();
            };
        };

        // Add Delete Selected button handler - using a single event listener
        if (deleteSelectedButton) {
            // Remove any existing event listeners by cloning and replacing the button
            const newDeleteSelectedButton = deleteSelectedButton.cloneNode(true);
            deleteSelectedButton.parentNode.replaceChild(newDeleteSelectedButton, deleteSelectedButton);
            
            // Add the event listener to the new button
            newDeleteSelectedButton.addEventListener('click', () => {
                const selectedItems = savedFitsList.querySelectorAll('.fit-checkbox:checked');
                const selectedIds = Array.from(selectedItems).map(cb => 
                    cb.closest('.saved-fit-item').dataset.fitId
                );

                if (selectedIds.length > 0) {
                    // Show confirmation dialog before deletion
                    showDeleteConfirmation(selectedIds, () => deleteMultipleFits(selectedIds));
                }
            });
        }

        // Add event listener to search input using client-side filtering
        searchInput.addEventListener('input', (e) => {
            // No need to debounce since we're filtering client-side
            renderFitsList(e.target.value.trim());
        });

        // Add select all checkbox handler
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = savedFitsList.querySelectorAll('.fit-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = selectAllCheckbox.checked;
                });
                updateSelectedState();
            });
        }

        // Initial load of saved fits
        updateList();
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
        document.getElementById('clientNotes').value = savedData.clientNotes || '';
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

    removeDisabledBikeCards() {
        // Remove any disabled bike cards from the DOM
        const disabledBikeCards = document.querySelectorAll('.disabled-database-bike');
        disabledBikeCards.forEach(card => {
            card.remove();
        });

        // Remove any disabled bike data from the array
        this.bikes = this.bikes.filter(bike => !bike.isDisabled);

        // Update calculations
        this.updateCalculations();

        // Save data
        this.saveData();
    }

    // Add a method for toast notifications
    showToast(message, type = 'success', duration = 3000) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        // Set background color based on type
        let bgColor = 'var(--success-color, #4CAF50)';
        if (type === 'error') {
            bgColor = 'var(--error-color, #F44336)';
        } else if (type === 'info') {
            bgColor = 'var(--info-color, #2196F3)';
        }
        
        // Position the toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background-color: ${bgColor};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        toast.innerHTML = message;
        document.body.appendChild(toast);
        
        // Fade in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Fade out after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
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
        
// Add hover styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .delete-selected-button:hover {
        background-color: var(--error-color) !important;
        color: white !important;
    }
    .cancel-button:hover {
        background-color: var(--border-color) !important;
        color: var(--text-color) !important;
    }
`;
document.head.appendChild(styleSheet);
        