// Client Profiles Manager - Handles both local and cloud storage
const ClientProfilesManager = (() => {
    // Firebase references
    const db = firebase.firestore ? firebase.firestore() : null;
    let currentUser = null;
    
    // Initialize - should be called when the page loads
    const init = () => {
        console.log('Initializing ClientProfilesManager...');
        
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                console.log('User is logged in, using cloud storage for client profiles');
                // If user logs in, sync local profiles to cloud if they don't exist in cloud
                syncLocalToCloud();
                
                // Enable save/load buttons
                enableProfileButtons();
            } else {
                console.log('User is not logged in, disabling client profile functionality');
                // Disable save/load buttons for non-logged in users
                disableProfileButtons();
            }
        });
        
        // Set up initial button states
        setupButtonListeners();
    };
    
    // Set up button listeners
    const setupButtonListeners = () => {
        const saveButton = document.getElementById('saveButton');
        const loadButton = document.getElementById('loadButton');
        
        if (saveButton) {
            // Remove existing listeners
            const newSaveButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newSaveButton, saveButton);
            
            // Add click event for save button
            newSaveButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (currentUser) {
                    const clientName = document.getElementById('clientName').value;
                    if (!clientName) {
                        alert('Please enter a client name before saving');
                        return;
                    }
                    
                    // Get data from calculator
                    if (window.bikeCalculatorInstance) {
                        const data = window.bikeCalculatorInstance.getSaveData();
                        saveClientProfile(data)
                            .then(() => {
                                alert('Client profile saved successfully!');
                            })
                            .catch(error => {
                                alert('Error saving client profile: ' + error);
                            });
                    }
                } else {
                    promptLogin();
                }
            });
        }
        
        if (loadButton) {
            // Remove existing listeners
            const newLoadButton = loadButton.cloneNode(true);
            loadButton.parentNode.replaceChild(newLoadButton, loadButton);
            
            // Add click event for load button
            newLoadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (currentUser) {
                    getClientProfiles().then(profiles => {
                        if (profiles && profiles.length > 0) {
                            showLoadDialog(profiles);
                        } else {
                            alert('No saved profiles found');
                        }
                    });
                } else {
                    promptLogin();
                }
            });
        }
        
        // Disable buttons initially
        disableProfileButtons();
    };
    
    // Enable save/load buttons for logged-in users
    const enableProfileButtons = () => {
        console.log('Enabling profile buttons for logged-in users');
        const saveButton = document.getElementById('saveButton');
        const loadButton = document.getElementById('loadButton');
        
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.classList.remove('login-required');
            saveButton.title = "Save client profile";
            saveButton.style.pointerEvents = 'auto';
            saveButton.style.cursor = 'pointer';
            
            // Remove any existing login prompt listeners
            saveButton.removeAttribute('data-login-prompt');
        }
        
        if (loadButton) {
            loadButton.disabled = false;
            loadButton.classList.remove('login-required');
            loadButton.title = "Load client profile";
            loadButton.style.pointerEvents = 'auto';
            loadButton.style.cursor = 'pointer';
            
            // Remove any existing login prompt listeners
            loadButton.removeAttribute('data-login-prompt');
        }
        
        // Update client name field
        const clientNameInput = document.getElementById('clientName');
        if (clientNameInput) {
            clientNameInput.placeholder = "Enter client name";
            clientNameInput.disabled = false;
        }
        
        // Re-setup button listeners
        setupButtonListeners();
    };
    
    // Disable save/load buttons for non-logged-in users
    const disableProfileButtons = () => {
        console.log('Disabling profile buttons for non-logged-in users');
        const saveButton = document.getElementById('saveButton');
        const loadButton = document.getElementById('loadButton');
        
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.classList.add('login-required');
            saveButton.title = "Login or create an account to save client profiles";
            saveButton.style.pointerEvents = 'auto';
            saveButton.style.cursor = 'pointer';
            
            if (!saveButton.hasAttribute('data-login-prompt')) {
                saveButton.setAttribute('data-login-prompt', 'true');
                saveButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    promptLogin();
                });
            }
        }
        
        if (loadButton) {
            loadButton.disabled = true;
            loadButton.classList.add('login-required');
            loadButton.title = "Login or create an account to load client profiles";
            loadButton.style.pointerEvents = 'auto';
            loadButton.style.cursor = 'pointer';
            
            if (!loadButton.hasAttribute('data-login-prompt')) {
                loadButton.setAttribute('data-login-prompt', 'true');
                loadButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    promptLogin();
                });
            }
        }
        
        // Clear client name field
        const clientNameInput = document.getElementById('clientName');
        if (clientNameInput) {
            clientNameInput.value = '';
            clientNameInput.placeholder = "Login to save client profiles";
            clientNameInput.disabled = true;
        }
    };
    
    // Prompt user to login when trying to use profile features
    const promptLogin = () => {
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
            max-width: 450px;
            width: 90%;
            text-align: center;
            z-index: 1001;
        `;
        
        alertDialog.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">🔒</span>
                <h3 style="margin: 0; color: var(--primary-color);">Login Required</h3>
            </div>
            <p style="margin-bottom: 15px;">Client profiles are now stored in the cloud for easy access from any device.</p>
            <p style="margin-bottom: 20px;">Create an account or log in to:</p>
            <ul style="text-align: left; margin-bottom: 20px; padding-left: 30px;">
                <li>Save client bike fit data</li>
                <li>Access your client profiles from any device</li>
                <li>Keep your client data secure and backed up</li>
            </ul>
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                <button class="cancel-button">Cancel</button>
                <button class="login-button">Login / Sign Up</button>
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
        
        // Style buttons
        const cancelButton = alertDialog.querySelector('.cancel-button');
        cancelButton.style.cssText = `
            padding: 10px 16px;
            background: transparent;
            color: var(--text-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        `;
        
        const loginButton = alertDialog.querySelector('.login-button');
        loginButton.style.cssText = `
            padding: 10px 16px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        `;
        
        // Add hover effects
        cancelButton.onmouseover = () => {
            cancelButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        };
        cancelButton.onmouseout = () => {
            cancelButton.style.backgroundColor = 'transparent';
        };
        
        loginButton.onmouseover = () => {
            loginButton.style.backgroundColor = 'var(--primary-color-light)';
        };
        loginButton.onmouseout = () => {
            loginButton.style.backgroundColor = 'var(--primary-color)';
        };
        
        // Function to close the dialog
        const closeDialog = () => {
            if (document.body.contains(alertDialog)) {
                document.body.removeChild(alertDialog);
            }
            if (document.body.contains(alertOverlay)) {
                document.body.removeChild(alertOverlay);
            }
        };
        
        // Add event listeners
        cancelButton.onclick = closeDialog;
        loginButton.onclick = () => {
            closeDialog();
            window.location.href = 'login.html';
        };
        
        // Handle keyboard events
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                closeDialog();
                window.location.href = 'login.html';
            }
        };
        
        // Add keyboard event listener
        document.addEventListener('keydown', handleKeyDown);
        
        // Remove event listener when dialog is closed
        const removeListener = () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        // Ensure event listener is removed
        alertOverlay.addEventListener('click', () => {
            closeDialog();
            removeListener();
        });
        
        // Focus the login button
        loginButton.focus();
    };
    
    // Get all client profiles (from appropriate storage)
    const getClientProfiles = async () => {
        console.log('Getting client profiles...');
        if (!currentUser) {
            console.log('User not logged in, returning local profiles');
            // If not logged in, return local profiles
            return getLocalClientProfiles();
        }
        
        try {
            console.log('User logged in, fetching profiles from Firestore');
            // If logged in, get profiles from Firestore
            if (!db) {
                console.error('Firestore not initialized');
                return [];
            }
            
            const profilesRef = db.collection('users').doc(currentUser.uid).collection('profiles');
            const snapshot = await profilesRef.orderBy('timestamp', 'desc').get();
            
            if (snapshot.empty) {
                console.log('No profiles found in Firestore');
                return [];
            }
            
            const profiles = [];
            snapshot.forEach(doc => {
                profiles.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('Fetched profiles:', profiles);
            return profiles;
        } catch (error) {
            console.error('Error getting client profiles:', error);
            return [];
        }
    };
    
    // Get client profiles from local storage
    const getLocalClientProfiles = () => {
        try {
            const profiles = JSON.parse(localStorage.getItem('clientProfiles') || '[]');
            return profiles;
        } catch (error) {
            console.error('Error getting local client profiles:', error);
            return [];
        }
    };
    
    // Save client profile (to appropriate storage)
    const saveClientProfile = async (profile) => {
        console.log('Saving client profile:', profile);
        
        // Get client name from input field
        const clientNameInput = document.getElementById('clientName');
        if (!clientNameInput || !clientNameInput.value.trim()) {
            throw new Error('Please enter a client name before saving');
        }
        
        const clientName = clientNameInput.value.trim();
        
        if (!currentUser) {
            console.log('User not logged in, saving to local storage');
            // If not logged in, save to local storage
            return saveLocalClientProfile({
                ...profile,
                clientName
            });
        }
        
        try {
            console.log('User logged in, saving to Firestore');
            // If logged in, save to Firestore
            if (!db) {
                console.error('Firestore not initialized');
                throw new Error('Database not available');
            }
            
            const profileData = {
                clientName,
                data: profile,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: currentUser.uid
            };
            
            const profilesRef = db.collection('users').doc(currentUser.uid).collection('profiles');
            
            // Check if profile with this client name already exists
            const snapshot = await profilesRef.where('clientName', '==', clientName).get();
            
            if (!snapshot.empty) {
                // Update existing profile
                const docId = snapshot.docs[0].id;
                await profilesRef.doc(docId).update(profileData);
                console.log('Updated existing profile:', docId);
                return docId;
            } else {
                // Create new profile
                const docRef = await profilesRef.add(profileData);
                console.log('Created new profile:', docRef.id);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving client profile:', error);
            throw error;
        }
    };
    
    // Save client profile to local storage
    const saveLocalClientProfile = (profile) => {
        try {
            const profiles = getLocalClientProfiles();
            
            // Check if profile with this client name already exists
            const existingIndex = profiles.findIndex(p => p.clientName === profile.clientName);
            
            if (existingIndex !== -1) {
                // Update existing profile
                profiles[existingIndex] = {
                    ...profiles[existingIndex],
                    ...profile,
                    timestamp: Date.now()
                };
            } else {
                // Add new profile
                profiles.push({
                    id: Date.now().toString(),
                    ...profile,
                    timestamp: Date.now()
                });
            }
            
            localStorage.setItem('clientProfiles', JSON.stringify(profiles));
            return existingIndex !== -1 ? profiles[existingIndex].id : profiles[profiles.length - 1].id;
        } catch (error) {
            console.error('Error saving local client profile:', error);
            throw error;
        }
    };
    
    // Delete client profile
    const deleteClientProfile = async (profileId) => {
        console.log('Deleting client profile:', profileId);
        
        if (!currentUser) {
            console.log('User not logged in, deleting from local storage');
            // If not logged in, delete from local storage
            return deleteLocalClientProfile(profileId);
        }
        
        try {
            console.log('User logged in, deleting from Firestore');
            // If logged in, delete from Firestore
            if (!db) {
                console.error('Firestore not initialized');
                throw new Error('Database not available');
            }
            
            await db.collection('users').doc(currentUser.uid)
                .collection('profiles').doc(profileId).delete();
            
            console.log('Profile deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting client profile:', error);
            throw error;
        }
    };
    
    // Delete client profile from local storage
    const deleteLocalClientProfile = (profileId) => {
        try {
            const profiles = getLocalClientProfiles();
            const filteredProfiles = profiles.filter(p => p.id !== profileId);
            localStorage.setItem('clientProfiles', JSON.stringify(filteredProfiles));
            return true;
        } catch (error) {
            console.error('Error deleting local client profile:', error);
            throw error;
        }
    };
    
    // Sync local profiles to cloud if they don't exist in cloud
    const syncLocalToCloud = async () => {
        if (!currentUser || !db) return;
        
        try {
            console.log('Syncing local profiles to cloud...');
            const localProfiles = getLocalClientProfiles();
            
            if (localProfiles.length === 0) {
                console.log('No local profiles to sync');
                return;
            }
            
            // Get existing cloud profiles
            const profilesRef = db.collection('users').doc(currentUser.uid).collection('profiles');
            const snapshot = await profilesRef.get();
            const cloudProfiles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Find local profiles that don't exist in cloud (by client name)
            const cloudClientNames = cloudProfiles.map(p => p.clientName);
            const profilesToSync = localProfiles.filter(p => !cloudClientNames.includes(p.clientName));
            
            if (profilesToSync.length === 0) {
                console.log('All local profiles already exist in cloud');
                return;
            }
            
            console.log(`Syncing ${profilesToSync.length} local profiles to cloud`);
            
            // Add each local profile to cloud
            const batch = db.batch();
            
            profilesToSync.forEach(profile => {
                const newProfileRef = profilesRef.doc();
                batch.set(newProfileRef, {
                    clientName: profile.clientName,
                    data: profile.data || profile,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: currentUser.uid
                });
            });
            
            await batch.commit();
            console.log('Local profiles synced to cloud successfully');
        } catch (error) {
            console.error('Error syncing local profiles to cloud:', error);
        }
    };
    
    // Show load dialog with saved profiles
    const showLoadDialog = (profiles) => {
        console.log('Showing load dialog with profiles:', profiles);
        
        // Create dialog container
        const loadDialog = document.createElement('div');
        loadDialog.className = 'load-dialog';
        loadDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg);
            color: var(--text-color);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
        `;
        
        // Create overlay
        const loadOverlay = document.createElement('div');
        loadOverlay.className = 'load-overlay';
        loadOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
        `;
        
        // Create dialog content
        let dialogContent = `
            <h2 style="margin-top: 0; margin-bottom: 20px; color: var(--primary-color);">Load Client Profile</h2>
            <div style="margin-bottom: 15px;">
                <input type="text" id="profileSearchInput" placeholder="Search profiles..." style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--input-bg);
                    color: var(--text-color);
                    margin-bottom: 15px;
                ">
            </div>
            <div id="profilesList" style="
                max-height: 50vh;
                overflow-y: auto;
                border-top: 1px solid var(--border-color);
                padding-top: 10px;
            ">
        `;
        
        // Add profiles to the list
        if (profiles.length === 0) {
            dialogContent += `<p style="text-align: center; color: var(--text-secondary);">No saved profiles found</p>`;
        } else {
            profiles.forEach(profile => {
                const date = new Date(profile.timestamp).toLocaleDateString();
                const time = new Date(profile.timestamp).toLocaleTimeString();
                
                dialogContent += `
                    <div class="profile-item" data-id="${profile.id}" style="
                        padding: 12px;
                        border-bottom: 1px solid var(--border-color);
                        cursor: pointer;
                        transition: background 0.2s;
                    ">
                        <div style="font-weight: 500;">${profile.clientName}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Saved on ${date} at ${time}</div>
                    </div>
                `;
            });
        }
        
        dialogContent += `
            </div>
            <div style="
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
                border-top: 1px solid var(--border-color);
                padding-top: 15px;
            ">
                <button id="cancelLoadButton" style="
                    padding: 8px 16px;
                    background: transparent;
                    color: var(--text-color);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    cursor: pointer;
                ">Cancel</button>
                <button id="deleteProfileButton" style="
                    padding: 8px 16px;
                    background: #FF3B30;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: none;
                ">Delete</button>
            </div>
        `;
        
        loadDialog.innerHTML = dialogContent;
        
        // Add to DOM
        document.body.appendChild(loadOverlay);
        document.body.appendChild(loadDialog);
        
        // Add event listeners
        const cancelButton = document.getElementById('cancelLoadButton');
        const deleteButton = document.getElementById('deleteProfileButton');
        const searchInput = document.getElementById('profileSearchInput');
        const profilesList = document.getElementById('profilesList');
        
        // Cancel button
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(loadDialog);
            document.body.removeChild(loadOverlay);
        });
        
        // Search functionality
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const profileItems = profilesList.querySelectorAll('.profile-item');
            
            profileItems.forEach(item => {
                const clientName = item.querySelector('div').textContent.toLowerCase();
                if (clientName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        // Profile item click
        const profileItems = profilesList.querySelectorAll('.profile-item');
        profileItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove selected class from all items
                profileItems.forEach(i => i.style.background = '');
                
                // Add selected class to clicked item
                item.style.background = 'var(--hover-bg)';
                
                // Show delete button
                deleteButton.style.display = 'block';
                
                // Store selected profile ID
                deleteButton.setAttribute('data-profile-id', item.getAttribute('data-id'));
                
                // Double click to load
                item.addEventListener('dblclick', () => {
                    const profileId = item.getAttribute('data-id');
                    loadProfile(profileId, profiles);
                });
            });
        });
        
        // Delete button
        deleteButton.addEventListener('click', () => {
            const profileId = deleteButton.getAttribute('data-profile-id');
            if (profileId) {
                if (confirm('Are you sure you want to delete this profile?')) {
                    deleteClientProfile(profileId)
                        .then(() => {
                            // Remove from DOM
                            const item = profilesList.querySelector(`[data-id="${profileId}"]`);
                            if (item) {
                                item.remove();
                            }
                            
                            // Hide delete button
                            deleteButton.style.display = 'none';
                            
                            // Show message if no profiles left
                            if (profilesList.querySelectorAll('.profile-item').length === 0) {
                                profilesList.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No saved profiles found</p>`;
                            }
                        })
                        .catch(error => {
                            alert('Error deleting profile: ' + error);
                        });
                }
            }
        });
        
        // Focus search input
        searchInput.focus();
    };
    
    // Load a profile
    const loadProfile = (profileId, profiles) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile && window.bikeCalculatorInstance) {
            window.bikeCalculatorInstance.loadSavedFit(profile.data);
            
            // Close dialog
            const loadDialog = document.querySelector('.load-dialog');
            const loadOverlay = document.querySelector('.load-overlay');
            if (loadDialog) document.body.removeChild(loadDialog);
            if (loadOverlay) document.body.removeChild(loadOverlay);
            
            // Update client name
            const clientNameInput = document.getElementById('clientName');
            if (clientNameInput) {
                clientNameInput.value = profile.clientName;
            }
        }
    };
    
    return {
        init,
        enableProfileButtons,
        disableProfileButtons,
        promptLogin,
        getClientProfiles,
        saveClientProfile,
        deleteClientProfile,
        showLoadDialog
    };
})();

// Initialize the client profiles manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing ClientProfilesManager');
    ClientProfilesManager.init();
}); 