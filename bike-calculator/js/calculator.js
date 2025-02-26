class BikeCalculator {
    constructor() {
        this.database = new BikeDatabase();
        this.bikes = [];
        this.bikeCount = 0;
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Add two regular bikes and one manual bike automatically
        for (let i = 0; i < 2; i++) {
            this.addBike();
        }
        this.addManualBike();
    }

    initializeEventListeners() {
        // Add bike buttons
        document.getElementById('addBike').addEventListener('click', () => this.addBike());
        document.getElementById('addManualBike').addEventListener('click', () => this.addManualBike());

        // Client name input
        const clientNameInput = document.getElementById('clientName');
        clientNameInput.addEventListener('input', () => {
            document.getElementById('saveButton').disabled = !clientNameInput.value.trim();
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
            brand: 'Manual Entry',
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
                    <input type="number" class="stem-height" value="40">
                    <span>mm</span>
                </div>
                <div class="input-group">
                    <label>Stem Length:</label>
                    <input type="number" class="stem-length" value="100">
                    <span>mm</span>
                </div>
                <div class="input-group">
                    <label>Stem Angle:</label>
                    <input type="number" class="stem-angle" value="-6">
                    <span>°</span>
                </div>
                <div class="input-group">
                    <label>Spacer Height:</label>
                    <input type="number" class="spacer-height" value="20">
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
                    <input type="text" class="brand-input">
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
        bike.reach = parseFloat(card.querySelector('.reach').value) || 0;
        bike.stack = parseFloat(card.querySelector('.stack').value) || 0;
        bike.hta = parseFloat(card.querySelector('.hta').value) || 73;
        bike.sta = parseFloat(card.querySelector('.sta').value) || 0;
        bike.stl = parseFloat(card.querySelector('.stl').value) || 0;
        bike.stemLength = parseFloat(card.querySelector('.stem-length').value) || 100;
        bike.stemAngle = parseFloat(card.querySelector('.stem-angle').value) || -6;
        bike.spacersHeight = parseFloat(card.querySelector('.spacer-height').value) || 20;
        
        // If it's a manual bike, update brand/model/size
        if (bike.isManual) {
            bike.brand = card.querySelector('.brand-input').value || 'Manual Entry';
            bike.model = card.querySelector('.model-input').value || '';
            bike.size = card.querySelector('.size-input').value || '';
        }
        
        // Find the index of the bike in the array
        const bikeIndex = this.bikes.findIndex(b => b.id === bikeId);
        if (bikeIndex !== -1) {
            this.updateCalculationsForBike(bikeId);
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
        
        // Update input fields
        card.querySelector('.reach').value = bike.reach;
        card.querySelector('.stack').value = bike.stack;
        card.querySelector('.hta').value = bike.hta;
        card.querySelector('.sta').value = bike.sta;
        card.querySelector('.stl').value = bike.stl;
        card.querySelector('.stem-length').value = bike.stemLength;
        card.querySelector('.stem-angle').value = bike.stemAngle;
        card.querySelector('.spacer-height').value = bike.spacersHeight;
        card.querySelector('.handlebar-reach').value = bike.handlebarReach;
        card.querySelector('.saddle-setback').value = bike.saddleSetback;
        card.querySelector('.saddle-height').value = bike.saddleHeight;
        
        // If it's a manual bike, reset brand/model/size fields
        if (bike.isManual) {
            bike.brand = 'Manual Entry';
            bike.model = '';
            bike.size = '';
            
            card.querySelector('.brand-input').value = bike.brand;
            card.querySelector('.model-input').value = bike.model;
            card.querySelector('.size-input').value = bike.size;
        }
        
        // Find the index of the bike in the array
        const bikeIndex = this.bikes.findIndex(b => b.id === bikeId);
        if (bikeIndex !== -1) {
            this.updateCalculationsForBike(bikeId);
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
    }

    async setupBikeSelectors(bikeId) {
        const card = document.getElementById(bikeId);
        const brandSelect = card.querySelector('.brand-select');
        const modelSelect = card.querySelector('.model-select');
        const sizeSelect = card.querySelector('.size-select');

        // Populate brands
        const brands = await this.database.getBrands();
        brandSelect.innerHTML = '<option value="">Select Brand</option>';
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });

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
                const geometry = await this.database.getGeometry(
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
                        bike.hta = geometry.headTubeAngle;
                        bike.sta = geometry.seatTubeAngle;
                        bike.stl = geometry.seatTubeLength;
                        
                        // Update display
                        card.querySelector('.reach').value = geometry.reach;
                        card.querySelector('.stack').value = geometry.stack;
                        card.querySelector('.hta').value = geometry.headTubeAngle;
                        card.querySelector('.sta').value = geometry.seatTubeAngle;
                        card.querySelector('.stl').value = geometry.seatTubeLength;
                        
                        // Update calculations for this bike only
                        this.updateCalculationsForBike(bikeId);
                    }
                }
            }
            this.updateBikeData(bikeId);
        });
    }
}

class BikeDatabase {
    constructor() {
        this.db = null;
        this.baseUrl = 'http://localhost:8000';
        this.initDatabase();
    }

    async initDatabase() {
        try {
            // Initialize SQL.js
            const SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            
            // Fetch the database file
            const response = await fetch(`${this.baseUrl}/bikeGeo.db`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const uInt8Array = new Uint8Array(arrayBuffer);
            
            // Create the database instance
            this.db = new SQL.Database(uInt8Array);
            console.log('Database initialized successfully');
        } catch (err) {
            console.error('Error initializing database:', err);
            alert('Failed to load the bike database. Please ensure the server is running at ' + this.baseUrl + ' and bikeGeo.db is in the correct location.');
        }
    }

    async getBrands() {
        if (!this.db) {
            console.log('Database not initialized, attempting to initialize...');
            await this.initDatabase();
        }
        try {
            const result = this.db.exec("SELECT DISTINCT Brand FROM 'Frame Database' ORDER BY Brand");
            return result[0]?.values.map(row => row[0]) || [];
        } catch (err) {
            console.error('Error getting brands:', err);
            return [];
        }
    }

    async getModels(brand) {
        if (!this.db) await this.initDatabase();
        try {
            const stmt = this.db.prepare("SELECT DISTINCT Model FROM 'Frame Database' WHERE Brand = ? ORDER BY Model");
            stmt.bind([brand]);
            const models = [];
            while (stmt.step()) {
                models.push(stmt.get()[0]);
            }
            stmt.free();
            return models;
        } catch (err) {
            console.error('Error getting models:', err);
            return [];
        }
    }

    async getSizes(brand, model) {
        if (!this.db) await this.initDatabase();
        try {
            const stmt = this.db.prepare("SELECT DISTINCT Size FROM 'Frame Database' WHERE Brand = ? AND Model = ? ORDER BY Size");
            stmt.bind([brand, model]);
            const sizes = [];
            while (stmt.step()) {
                sizes.push(stmt.get()[0]);
            }
            stmt.free();
            return sizes;
        } catch (err) {
            console.error('Error getting sizes:', err);
            return [];
        }
    }

    async getGeometry(brand, model, size) {
        if (!this.db) await this.initDatabase();
        try {
            const stmt = this.db.prepare(`
                SELECT Reach, Stack, HTA as hta, 
                       STA as sta, "ST Length" as stl 
                FROM 'Frame Database' 
                WHERE Brand = ? AND Model = ? AND Size = ?
                LIMIT 1
            `);
            stmt.bind([brand, model, size]);
            let geometry = null;
            if (stmt.step()) {
                const row = stmt.getAsObject();
                geometry = {
                    reach: row.Reach,
                    stack: row.Stack,
                    headTubeAngle: row.hta,
                    seatTubeAngle: row.sta,
                    seatTubeLength: row.stl
                };
            }
            stmt.free();
            return geometry;
        } catch (err) {
            console.error('Error getting geometry:', err);
            return null;
        }
    }
}
