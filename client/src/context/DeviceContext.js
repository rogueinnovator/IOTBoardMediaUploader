'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  registerDevice,
  updateDeviceStatus,
  subscribeToMediaUpdates,
  checkNetworkAndReconnect,
  initializeFirestoreCollections,
  checkFirestoreAccess,
  checkMediaCollection
} from '@/lib/firebaseUtils';
import { useAuth } from '@/context/AuthContext';

// Create context
const DeviceContext = createContext();

// Custom hook to use the device context
export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

// Provider component
export const DeviceProvider = ({ children }) => {
  const [deviceCode, setDeviceCode] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasRuleIssue, setHasRuleIssue] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  const { isAuthenticated } = useAuth();

  // Initialize Firestore collections when the app starts
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        // First check Firestore access
        const accessCheck = await checkFirestoreAccess();
        if (!accessCheck.success) {
          if (accessCheck.message && accessCheck.message.includes('400')) {
            setHasRuleIssue(true);
            setError('Firebase security rules are preventing access. Please check your Firestore rules or API key restrictions.');
          } else {
            setIsOffline(true);
            setError('Unable to initialize Firebase: ' + accessCheck.message);
          }
          setLoading(false);
          return;
        }

        // Add a small delay before initializing collections to ensure Firebase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));

        const success = await initializeFirestoreCollections();
        setIsInitialized(success);
        if (!success) {
          setIsOffline(true);
          setError('Unable to initialize Firebase. Please check your internet connection.');
        }
      } catch (err) {
        console.error('Error during initialization:', err);

        // Check for 400 errors which often indicate rule issues
        if (err.message && err.message.includes('400')) {
          setHasRuleIssue(true);
          setError('Firebase security rules are preventing access. Please check your Firestore rules or API key restrictions.');
        } else {
          setIsOffline(true);
          setError('Failed to initialize: ' + (err.message || 'Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      // Add a small delay before initialization to ensure auth is fully processed
      setTimeout(() => {
        initialize();
      }, 1000);
    }
  }, [isAuthenticated]);

  // Register device with the provided code
  const register = async (code) => {
    if (!code || code.trim() === '') {
      setError('Please enter a valid code');
      return false;
    }

    setLoading(true);
    setError(null);
    setIsOffline(false);
    setHasRuleIssue(false);
    setHasAuthError(false);

    try {
      // Try to reconnect if offline
      if (isOffline) {
        const reconnected = await checkNetworkAndReconnect();
        if (!reconnected) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
          setLoading(false);
          return false;
        }
      }

      const result = await registerDevice(code);

      if (result.success) {
        setDeviceCode(code);
        setIsRegistered(true);
        setIsOffline(false);
        setHasRuleIssue(false);
        setHasAuthError(false);

        // Store code in localStorage for persistence
        localStorage.setItem('deviceCode', code);

        setLoading(false);
        return true;
      } else {
        // Check if it's an offline error
        if (result.isOffline) {
          setIsOffline(true);
        }

        // Check if it's a rule issue
        if (result.isRuleIssue) {
          setHasRuleIssue(true);
        }

        // Check if it's an auth error
        if (result.isAuthError) {
          setHasAuthError(true);
        }

        setError(result.message || 'Failed to register device');
        setLoading(false);
        return false;
      }
    } catch (err) {
      // Check if it's a network error
      if (err.message && (err.message.includes('offline') || err.message.includes('network'))) {
        setIsOffline(true);
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (err.message && err.message.includes('400')) {
        setHasRuleIssue(true);
        setError('Firebase security rules are preventing access. Please check your Firestore rules or API key restrictions.');
      } else if (err.message && err.message.includes('auth')) {
        setHasAuthError(true);
        setError('Authentication error: ' + err.message);
      } else {
        setError(err.message || 'An unexpected error occurred');
      }

      setLoading(false);
      return false;
    }
  };

  // Retry connection if offline
  const retryConnection = async () => {
    setLoading(true);
    setError(null);
    setHasRuleIssue(false);
    setHasAuthError(false);

    try {
      // First check Firestore access
      const accessCheck = await checkFirestoreAccess();
      if (!accessCheck.success) {
        if (accessCheck.message && accessCheck.message.includes('400')) {
          setHasRuleIssue(true);
          setError('Firebase security rules are preventing access. Please check your Firestore rules or API key restrictions.');
        } else {
          setIsOffline(true);
          setError('Unable to access Firebase: ' + accessCheck.message);
        }
        setLoading(false);
        return false;
      }

      // Try to initialize collections
      const initialized = await initializeFirestoreCollections();
      if (!initialized) {
        setError('Still unable to initialize Firebase. Please check your internet connection.');
        setLoading(false);
        return false;
      }

      // Check media collection directly
      const mediaCheck = await checkMediaCollection();
      console.log('Media collection check result:', mediaCheck);

      const reconnected = await checkNetworkAndReconnect();
      if (reconnected) {
        setIsOffline(false);
        setIsInitialized(true);

        // If we have a device code, try to register again
        if (deviceCode) {
          return await register(deviceCode);
        }

        setLoading(false);
        return true;
      } else {
        setError('Still unable to connect. Please check your internet connection.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      if (err.message && err.message.includes('400')) {
        setHasRuleIssue(true);
        setError('Firebase security rules are preventing access. Please check your Firestore rules or API key restrictions.');
      } else if (err.message && err.message.includes('auth')) {
        setHasAuthError(true);
        setError('Authentication error: ' + err.message);
      } else {
        setError('Failed to reconnect: ' + (err.message || 'Unknown error'));
      }
      setLoading(false);
      return false;
    }
  };

  // Check for stored device code on mount
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return; // Don't try to register until Firebase is initialized and user is authenticated

    // Add a small delay before attempting to register to ensure everything is initialized
    const timer = setTimeout(() => {
      const storedCode = localStorage.getItem('deviceCode');
      if (storedCode) {
        register(storedCode);
      }
    }, 1500);

    // Set up beforeunload event to update device status when closing
    const handleBeforeUnload = () => {
      if (deviceCode) {
        try {
          updateDeviceStatus(deviceCode, 'offline');
        } catch (error) {
          console.error('Error updating device status on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set up online/offline event listeners
    const handleOnline = () => {
      setIsOffline(false);
      if (deviceCode) {
        try {
          updateDeviceStatus(deviceCode, 'online');
        } catch (error) {
          console.error('Error updating device status on online:', error);
        }
      }
    };

    // Clean up the timer
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [deviceCode, isInitialized, isAuthenticated]);

  // Subscribe to media updates when registered
  useEffect(() => {
    console.log("device confirmed ", isRegistered, deviceCode, isInitialized, isAuthenticated);
    let unsubscribe = () => { };

    if (isRegistered && deviceCode && isInitialized && isAuthenticated) {
      console.log('Setting up media subscription for device code:', deviceCode);

      unsubscribe = subscribeToMediaUpdates(deviceCode, (items, err) => {
        if (err) {
          console.error('Error in media subscription:', err);
          // Check if it's a network error
          if (err.message && (err.message.includes('offline') || err.message.includes('network'))) {
            setIsOffline(true);
            setError('Connection lost. Waiting for reconnection...');
          } else if (err.isRuleIssue) {
            setHasRuleIssue(true);
            setError(err.message || 'Firebase security rules are preventing access.');
          } else if (err.message && err.message.includes('auth')) {
            setHasAuthError(true);
            setError('Authentication error: ' + err.message);
          } else {
            setError(err.message || 'Error receiving media updates');
          }
        } else {
          console.log('Received media items:', items);
          setMediaItems(items);

          // Set current media to the most recent one if available
          if (items.length > 0) {
            console.log('Setting current media to:', items[0]);
            setCurrentMedia(items[0]);
          }
        }
      });
    }

    return () => {
      unsubscribe();
    };
  }, [isRegistered, deviceCode, isInitialized, isAuthenticated]);

  // Logout/unregister device
  const logout = async () => {
    if (deviceCode) {
      await updateDeviceStatus(deviceCode, 'offline');
    }

    setDeviceCode('');
    setIsRegistered(false);
    setMediaItems([]);
    setCurrentMedia(null);
    localStorage.removeItem('deviceCode');
  };

  const value = {
    deviceCode,
    isRegistered,
    mediaItems,
    currentMedia,
    loading,
    error,
    isOffline,
    isInitialized,
    hasRuleIssue,
    hasAuthError,
    register,
    logout,
    retryConnection,
    setCurrentMedia
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}; 