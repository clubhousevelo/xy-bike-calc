// Firebase Authentication Configuration
// This file handles all Firebase authentication functionality

// Firebase configuration object - you'll need to replace these values with your own
const firebaseConfig = {
    apiKey: "AIzaSyCsde9TK1Jyxnscq01Sgvny_PnPg6rXZkY",
    authDomain: "xy-bike-calc-2e94b.firebaseapp.com",
    projectId: "xy-bike-calc-2e94b",
    storageBucket: "xy-bike-calc-2e94b.firebasestorage.app",
    messagingSenderId: "831215730499",
    appId: "1:831215730499:web:fc6e2b4aba2383555479f6",
    measurementId: "G-H1TXBTLXDW"
};

// Initialize Firebase
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Get auth and firestore instances
  const auth = firebase.auth();
  const db = firebase.firestore ? firebase.firestore() : null;
  
  // Set up UI event listeners once the DOM is fully loaded
  setupAuthUI();
  
  // Check auth state and update UI accordingly
  auth.onAuthStateChanged(user => {
    updateUIForAuthState(user);
    
    // If user is logged in and we're on the main calculator page, load saved data
    if (user && window.location.pathname.includes('index.html') && typeof BikeCalculator !== 'undefined') {
      loadUserData(user.uid);
    }
  });
  
  // Function to load user data from Firestore
  function loadUserData(userId) {
    if (!db) return;
    
    db.collection('users').doc(userId).collection('bikeFits').get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No saved bike fits found');
          return;
        }
        
        // If we have a global bike calculator instance, populate it with saved data
        if (window.bikeCalculatorInstance) {
          const savedFits = [];
          snapshot.forEach(doc => {
            savedFits.push(doc.data());
          });
          
          // Sort by date created
          savedFits.sort((a, b) => b.createdAt - a.createdAt);
          
          // Load the most recent fit
          if (savedFits.length > 0) {
            window.bikeCalculatorInstance.loadSavedFit(savedFits[0]);
          }
        }
      })
      .catch(error => {
        console.error('Error loading user data:', error);
      });
  }
  
  // Function to save user data to Firestore
  window.saveUserData = function(data) {
    const user = auth.currentUser;
    if (!user || !db) return Promise.reject('User not logged in or Firestore not available');
    
    // Add timestamp and user info
    const fitData = {
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: user.uid
    };
    
    // Save to Firestore
    return db.collection('users').doc(user.uid).collection('bikeFits').add(fitData)
      .then(docRef => {
        console.log('Bike fit saved with ID:', docRef.id);
        return docRef.id;
      })
      .catch(error => {
        console.error('Error saving bike fit:', error);
        throw error;
      });
  };
});

// Set up UI event listeners for auth-related elements
function setupAuthUI() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Google Sign-in button
  const googleSignInButton = document.getElementById('google-signin');
  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', handleGoogleSignIn);
  }
  
  // Google Sign-up button
  const googleSignUpButton = document.getElementById('google-signup');
  if (googleSignUpButton) {
    googleSignUpButton.addEventListener('click', handleGoogleSignIn);
  }
  
  // Signup form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Logout buttons
  const logoutButtons = document.querySelectorAll('#logout-button');
  logoutButtons.forEach(button => {
    button.addEventListener('click', handleLogout);
  });
  
  // Profile link in navigation
  const userDisplayElements = document.querySelectorAll('.user-display');
  userDisplayElements.forEach(el => {
    el.addEventListener('click', function() {
      window.location.href = 'profile.html';
    });
    el.style.cursor = 'pointer';
  });
}

// Handle login form submission
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Clear form and any error messages
      e.target.reset();
      if (errorElement) errorElement.textContent = '';
      
      // Redirect to appropriate page after login
      window.location.href = 'index.html';
    })
    .catch((error) => {
      // Display error message
      if (errorElement) {
        errorElement.textContent = error.message;
      } else {
        console.error('Login error:', error.message);
      }
    });
}

// Handle Google Sign-in button click
function handleGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  // Determine which form we're dealing with based on active container
  const isSignupForm = document.getElementById('signup-form-container').classList.contains('active');
  const errorElement = isSignupForm ? 
    document.getElementById('signup-error') : 
    document.getElementById('login-error');
  
  // Display loading state
  if (errorElement) errorElement.textContent = 'Connecting to Google...';
  
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = result.credential;
      const user = result.user;
      
      // Clear any error messages
      if (errorElement) errorElement.textContent = '';
      
      // Check if this is a new user (first sign-in)
      const isNewUser = result.additionalUserInfo.isNewUser;
      
      if (isNewUser && firebase.firestore) {
        // Create user document in Firestore for new users
        const db = firebase.firestore();
        return db.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          authProvider: 'google'
        }).then(() => {
          // Redirect to the main page
          window.location.href = 'index.html';
        });
      } else {
        // Existing user, just redirect
        window.location.href = 'index.html';
      }
    })
    .catch((error) => {
      // Handle Errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      
      // Display error message
      if (errorElement) {
        errorElement.textContent = errorMessage;
      } else {
        console.error('Google Sign-in error:', errorMessage);
      }
    });
}

// Handle signup form submission
function handleSignup(e) {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const errorElement = document.getElementById('signup-error');
  
  // Check if passwords match
  if (password !== confirmPassword) {
    if (errorElement) errorElement.textContent = 'Passwords do not match';
    return;
  }
  
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Create user document in Firestore
      if (firebase.firestore) {
        const db = firebase.firestore();
        const user = userCredential.user;
        
        return db.collection('users').doc(user.uid).set({
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          // Clear form and any error messages
          e.target.reset();
          if (errorElement) errorElement.textContent = '';
          
          // Redirect to appropriate page after signup
          window.location.href = 'index.html';
        });
      } else {
        // Clear form and any error messages
        e.target.reset();
        if (errorElement) errorElement.textContent = '';
        
        // Redirect to appropriate page after signup
        window.location.href = 'index.html';
      }
    })
    .catch((error) => {
      // Display error message
      if (errorElement) {
        errorElement.textContent = error.message;
      } else {
        console.error('Signup error:', error.message);
      }
    });
}

// Handle logout button click
function handleLogout() {
  firebase.auth().signOut()
    .then(() => {
      // Redirect to login page or update UI
      window.location.href = 'login.html';
    })
    .catch((error) => {
      console.error('Logout error:', error);
    });
}

// Update UI based on authentication state
function updateUIForAuthState(user) {
  const authElements = document.querySelectorAll('.auth-dependent');
  const nonAuthElements = document.querySelectorAll('.non-auth-dependent');
  const userDisplayElements = document.querySelectorAll('.user-display');
  
  if (user) {
    // User is signed in
    authElements.forEach(el => el.style.display = 'block');
    nonAuthElements.forEach(el => el.style.display = 'none');
    
    // Update elements that display user info
    userDisplayElements.forEach(el => {
      el.textContent = user.displayName || user.email;
    });
    
    // If we're on the calculator page, enable save functionality
    if (window.location.pathname.includes('index.html') && window.bikeCalculatorInstance) {
      const saveButton = document.getElementById('saveButton');
      if (saveButton) {
        saveButton.disabled = false;
        
        // Add event listener for save button if not already added
        if (!saveButton.hasAttribute('data-auth-listener')) {
          saveButton.setAttribute('data-auth-listener', 'true');
          saveButton.addEventListener('click', function() {
            const clientName = document.getElementById('clientName').value;
            if (!clientName) {
              alert('Please enter a client name before saving');
              return;
            }
            
            // Get data from calculator
            const data = window.bikeCalculatorInstance.getSaveData();
            
            // Save to Firestore
            window.saveUserData(data)
              .then(() => {
                alert('Bike fit saved successfully!');
              })
              .catch(error => {
                alert('Error saving bike fit: ' + error);
              });
          });
        }
      }
    }
  } else {
    // User is signed out
    authElements.forEach(el => el.style.display = 'none');
    nonAuthElements.forEach(el => el.style.display = 'block');
    
    // Clear user info
    userDisplayElements.forEach(el => {
      el.textContent = '';
    });
    
    // If we're on the calculator page, disable save functionality
    if (window.location.pathname.includes('index.html')) {
      const saveButton = document.getElementById('saveButton');
      if (saveButton) {
        saveButton.disabled = true;
      }
    }
  }
} 