import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  getDocs,
  limit
} from 'firebase/firestore';

// Check if Firestore rules are blocking access
export const checkFirestoreAccess = async () => {
  try {
    console.log('Checking Firestore access permissions...');
    
    // Try to read from a test document
    const testRef = doc(db, 'test_access', 'test_document');
    await getDoc(testRef);
    
    // If we get here, we can at least read
    console.log('Firestore read access confirmed');
    
    try {
      // Try to write to the test document
      await setDoc(testRef, { 
        timestamp: serverTimestamp(),
        test: 'access_check' 
      }, { merge: true });
      
      console.log('Firestore write access confirmed');
      return { success: true, canRead: true, canWrite: true };
    } catch (writeError) {
      console.error('Firestore write access failed:', writeError);
      return { 
        success: true, 
        canRead: true, 
        canWrite: false,
        message: 'Can read but cannot write to Firestore',
        error: writeError
      };
    }
  } catch (error) {
    console.error('Firestore access check failed:', error);
    
    // Check for permission denied errors
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        canRead: false, 
        canWrite: false,
        message: 'Firebase security rules are preventing access. Please check your Firestore rules.',
        error
      };
    }
    
    // Check for 400 errors which often indicate rule issues
    if (error.message && error.message.includes('400')) {
      return {
        success: false,
        message: 'Received 400 error from Firebase. This often indicates security rule issues or API key restrictions.',
        error
      };
    }
    
    return { 
      success: false, 
      message: error.message || 'Unknown error checking Firestore access',
      error
    };
  }
};

// Initialize Firestore collections if they don't exist
export const initializeFirestoreCollections = async () => {
  try {
    console.log('Attempting to initialize Firestore collections...');
    
    // First check if we have access
    const accessCheck = await checkFirestoreAccess();
    if (!accessCheck.success) {
      console.error('Firestore access check failed:', accessCheck.message);
      return false;
    }
    
    try {
      // Check if devices collection exists
      const devicesQuery = query(collection(db, 'devices'), limit(1));
      const devicesSnapshot = await getDocs(devicesQuery);
      
      // If no documents exist, create a placeholder document
      if (devicesSnapshot.empty) {
        console.log('Creating devices collection with placeholder document...');
        const placeholderRef = doc(db, 'devices', 'placeholder');
        await setDoc(placeholderRef, {
          isPlaceholder: true,
          createdAt: serverTimestamp()
        });
      }
      
      // Check if media collection exists
      const mediaQuery = query(collection(db, 'media'), limit(1));
      const mediaSnapshot = await getDocs(mediaQuery);
      
      // If no documents exist, create a placeholder document
      if (mediaSnapshot.empty) {
        console.log('Creating media collection with placeholder document...');
        const placeholderRef = doc(db, 'media', 'placeholder');
        await setDoc(placeholderRef, {
          isPlaceholder: true,
          createdAt: serverTimestamp()
        });
      }
      
      console.log('Firestore collections initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing collections:', error);
      return false;
    }
  } catch (error) {
    console.error('Error initializing Firestore collections:', error);
    
    // Check for 400 errors which often indicate rule issues
    if (error.message && error.message.includes('400')) {
      console.error('Received 400 error. This often indicates security rule issues or API key restrictions.');
    }
    
    return false;
  }
};

// Check network connectivity and attempt to reconnect
export const checkNetworkAndReconnect = async () => {
  try {
    // Try to re-enable network
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.error('Failed to reconnect to Firebase:', error);
    return false;
  }
};

// Register a device with the provided code
export const registerDevice = async (code) => {
  try {
    // First, try to ensure network connectivity
    await checkNetworkAndReconnect();
    
    // Initialize collections if needed
    await initializeFirestoreCollections();
    
    // Get current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { 
        success: false, 
        message: 'You must be signed in to register a device',
        isAuthError: true
      };
    }
    
    // Check if the code already exists
    const deviceRef = doc(db, 'devices', code);
    const deviceSnap = await getDoc(deviceRef);
    
    if (deviceSnap.exists()) {
      // Device already registered, update last seen
      await setDoc(deviceRef, {
        lastSeen: serverTimestamp(),
        status: 'online',
        userId: currentUser.uid, // Add or update the user ID
        userEmail: currentUser.email
      }, { merge: true });
      return { success: true, message: 'Device reconnected', isNew: false };
    } else {
      // New device registration
      await setDoc(deviceRef, {
        code,
        registeredAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        status: 'online',
        userId: currentUser.uid, // Add the user ID
        userEmail: currentUser.email
      });
      return { success: true, message: 'Device registered successfully', isNew: true };
    }
  } catch (error) {
    console.error('Error registering device:', error);
    
    // Check if it's a network error
    if (error.message && error.message.includes('offline')) {
      return { 
        success: false, 
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        isOffline: true
      };
    }
    
    // Check for 400 errors which often indicate rule issues
    if (error.message && error.message.includes('400')) {
      return {
        success: false,
        message: 'Firebase security rules may be preventing access. Please check your Firestore rules.',
        isRuleIssue: true
      };
    }
    
    return { success: false, message: error.message };
  }
};

// Subscribe to media updates for a specific device code
export const subscribeToMediaUpdates = (code, callback) => {
  try {
    console.log('Setting up media subscription with device code:', code);
    
    const mediaQuery = query(
      collection(db, 'media'),
      where('deviceCode', '==', code)
    );
    
    console.log('Media query created with deviceCode:', code);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
      console.log('Media snapshot received, document count:', snapshot.size);
      
      const mediaItems = [];
      snapshot.forEach((doc) => {
        console.log('Media document data:', doc.id, doc.data());
        
        // Skip placeholder documents
        if (doc.id === 'placeholder' || doc.data().isPlaceholder) {
          console.log('Skipping placeholder document');
          return;
        }
        
        mediaItems.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Processed media items:', mediaItems.length);
      
      // Sort by timestamp if available
      mediaItems.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || a.createdAt?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || b.createdAt?.toMillis() || 0;
        return bTime - aTime; // Most recent first
      });
      
      callback(mediaItems);
    }, (error) => {
      console.error('Error listening to media updates:', error);
      
      // Check for 400 errors which often indicate rule issues
      if (error.message && error.message.includes('400')) {
        callback([], {
          message: 'Firebase security rules may be preventing access. Please check your Firestore rules.',
          isRuleIssue: true,
          originalError: error
        });
      } else {
        callback([], error);
      }
    });
    
    // Return unsubscribe function to clean up listener when needed
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up media subscription:', error);
    callback([], error);
    return () => {}; // Return empty function as fallback
  }
};

// Add a function to directly check the media collection
export const checkMediaCollection = async () => {
  try {
    console.log('Checking media collection...');
    
    // Get all documents from the media collection
    const mediaSnapshot = await getDocs(collection(db, 'media'));
    
    console.log('Media collection size:', mediaSnapshot.size);
    
    const mediaItems = [];
    mediaSnapshot.forEach((doc) => {
      console.log('Media document:', doc.id, doc.data());
      mediaItems.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      count: mediaItems.length,
      items: mediaItems
    };
  } catch (error) {
    console.error('Error checking media collection:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update device status (online/offline)
export const updateDeviceStatus = async (code, status) => {
  try {
    const deviceRef = doc(db, 'devices', code);
    await setDoc(deviceRef, {
      status,
      lastSeen: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating device status:', error);
    return { success: false, message: error.message };
  }
}; 