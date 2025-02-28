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
            const sessionStart = sessionStorage.getItem('calculatorSession');
            
            // Only load data if it's from the current session
            if (sessionStart && data.sessionTimestamp === sessionStart) {
                this.loadSavedData();
            } else {
                // Start fresh with default bikes
                for (let i = 0; i < 2; i++) {
                    this.addBike();
                }
                this.addManualBike();
                
                // Set new session timestamp
                sessionStorage.setItem('calculatorSession', Date.now().toString());
            }
        } else {
            // Start fresh with default bikes
            for (let i = 0; i < 2; i++) {
                this.addBike();
            }
            this.addManualBike();
            
            // Set new session timestamp
            sessionStorage.setItem('calculatorSession', Date.now().toString());
            }
        } catch (error) {
            console.error('Failed to initialize calculator:', error);
            alert('Failed to load bike database. Please check your internet connection and try again.');
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
            if (confirm('Are you sure you want to reset the XY Calculator? This will clear all bike data and measurements.')) {
                // Clear only XY calculator data from localStorage and sessionStorage
                localStorage.removeItem('xyCalculatorData');
                sessionStorage.removeItem('calculatorSession');
                
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
            }
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
                <button class="delete-button">×</button>
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
        bike.stemLength = parseFloat(card.querySelector('.stem-length').value) || 100;
        bike.stemAngle = parseFloat(card.querySelector('.stem-angle').value) || -6;
        bike.spacersHeight = parseFloat(card.querySelector('.spacer-height').value) || 20;
        
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
            const stemRad = (90 - bike.hta + bike.stemAngle) * Math.PI / 180;
            
            const stemCenterX = (bike.spacersHeight + 20) * Math.cos(htaRad); // Using 20mm as default stem height
            const stemCenterY = (bike.spacersHeight + 20) * Math.sin(htaRad);
            
            const clampX = bike.stemLength * Math.cos(stemRad);
            const clampY = bike.stemLength * Math.sin(stemRad);
            
            handlebarX = bike.reach + stemCenterX + clampX;
            handlebarY = bike.stack + stemCenterY + clampY;

            // Calculate bar reach needed
            if (targetHandlebarX) {
                barReachNeeded = targetHandlebarX + handlebarReachUsed - Math.round(handlebarX);
            }

            // Calculate differences between target and actual handlebar positions
            if (targetHandlebarX) {
                const xDiff = targetHandlebarX - Math.round(handlebarX);
                handlebarXDiff = xDiff > 0 ? `+${xDiff}` : `${xDiff}`;
            }
            
            if (targetHandlebarY) {
                const yDiff = targetHandlebarY - Math.round(handlebarY);
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
                card.querySelector('.handlebar-x').innerHTML = `${Math.round(handlebarX)} mm <span class="diff ${parseInt(handlebarXDiff) < 0 ? 'negative' : 'positive'}">(${handlebarXDiff})</span>`;
            }
            
            card.querySelector('.handlebar-y').textContent = `${Math.round(handlebarY)} mm`;
            if (handlebarYDiff) {
                card.querySelector('.handlebar-y').innerHTML = `${Math.round(handlebarY)} mm <span class="diff ${parseInt(handlebarYDiff) < 0 ? 'negative' : 'positive'}">(${handlebarYDiff})</span>`;
            }
            
            card.querySelector('.bar-reach-needed').textContent = 
                targetHandlebarX ? `${barReachNeeded} mm` : '-- mm';
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
            sessionTimestamp: sessionStorage.getItem('calculatorSession'),
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
        // Check if there are any bikes with data
        if (this.bikes.length === 0) {
            alert('No bike data to print.');
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
                            const diff = targetValue - actualValue;
                            
                            if (Math.abs(diff) >= 1) {
                                let diffText = '';
                                if (diff > 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #007AFF;">→ ${diff}mm longer</span>`;
                                } else if (diff < 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #FF3B30;">← ${Math.abs(diff)}mm shorter</span>`;
                                }
                                
                                resultsData += `<p>${label} ${value} ${diffText}</p>`;
                            } else {
                                resultsData += `<p>${label} ${value}</p>`;
                            }
                        } else {
                            resultsData += `<p>${label} ${value}</p>`;
                        }
                    } 
                    else if (label === 'Handlebar Y:' && targetHandlebarY && value !== '-- mm') {
                        const actualValue = parseInt(value);
                        if (!isNaN(actualValue)) {
                            const targetValue = parseInt(targetHandlebarY);
                            const diff = targetValue - actualValue;
                            
                            if (Math.abs(diff) >= 1) {
                                let diffText = '';
                                if (diff > 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #007AFF;">↑ ${diff}mm higher</span>`;
                                } else if (diff < 0) {
                                    diffText = `<span style="display: block; font-size: 12px; color: #FF3B30;">↓ ${Math.abs(diff)}mm lower</span>`;
                                }
                                
                                resultsData += `<p>${label} ${value} ${diffText}</p>`;
                            } else {
                                resultsData += `<p>${label} ${value}</p>`;
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
        const range = 'A1:I1000';  // Adjust range to include all necessary columns
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
        return [...new Set(this.bikeData
            .filter(bike => bike.brand === brand && bike.model === model)
            .map(bike => bike.size))]
            .sort();
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
