// Client Profiles Manager - Local Storage Only
const ClientProfilesManager = (() => {
    // Get all client profiles from local storage
    const getClientProfiles = () => {
        const profiles = localStorage.getItem('clientProfiles');
        return profiles ? JSON.parse(profiles) : [];
    };
    
    // Save a client profile to local storage
    const saveClientProfile = (profile) => {
        const profiles = getClientProfiles();
        
        if (profile.id) {
            // Update existing profile
            const index = profiles.findIndex(p => p.id === profile.id);
            if (index !== -1) {
                profiles[index] = {
                    ...profile,
                    updatedAt: new Date().toISOString()
                };
            } else {
                profiles.push({
                    ...profile,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        } else {
            // Create new profile
            profiles.push({
                ...profile,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('clientProfiles', JSON.stringify(profiles));
        return profile;
    };
    
    // Delete a client profile from local storage
    const deleteClientProfile = (profileId) => {
        const profiles = getClientProfiles();
        const filteredProfiles = profiles.filter(p => p.id !== profileId);
        localStorage.setItem('clientProfiles', JSON.stringify(filteredProfiles));
        return true;
    };
    
    // Set up button listeners
    const setupButtonListeners = () => {
        console.log('Setting up button listeners');
        const saveButton = document.getElementById('saveButton');
        const loadButton = document.getElementById('loadButton');
        
        if (saveButton) {
            saveButton.addEventListener('click', handleSaveClick);
            saveButton.disabled = false;
            saveButton.title = "Save client profile";
        }
        
        if (loadButton) {
            loadButton.addEventListener('click', handleLoadClick);
            loadButton.disabled = false;
            loadButton.title = "Open client profile";
        }
        
        const clientNameInput = document.getElementById('clientName');
        if (clientNameInput) {
            clientNameInput.disabled = false;
            clientNameInput.placeholder = "Enter client name";
        }
    };
    
    // Handle save button click
    const handleSaveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Save button clicked');
        
        const clientNameInput = document.getElementById('clientName');
        if (!clientNameInput || !clientNameInput.value.trim()) {
            alert('Please enter a client name before saving');
            return;
        }
        
        if (!window.bikeCalculatorInstance) {
            console.error('Bike calculator instance not found');
            alert('Error: Calculator not initialized');
            return;
        }
        
        try {
            const data = window.bikeCalculatorInstance.getSaveData();
            saveClientProfile(data);
            alert('Client profile saved successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile: ' + error.message);
        }
    };
    
    // Handle load button click
    const handleLoadClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Load button clicked');
        
        try {
            const profiles = getClientProfiles();
            if (profiles && profiles.length > 0) {
                showLoadDialog(profiles);
            } else {
                alert('No saved profiles found');
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
            alert('Error loading profiles: ' + error.message);
        }
    };
    
    // Initialize
    const init = () => {
        console.log('Initializing ClientProfilesManager...');
        setupButtonListeners();
    };
    
    return {
        init,
        getClientProfiles,
        saveClientProfile,
        deleteClientProfile
    };
})();

// Initialize the client profiles manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    ClientProfilesManager.init();
}); 