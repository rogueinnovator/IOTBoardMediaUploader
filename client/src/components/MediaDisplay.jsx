'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDevice } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import { checkMediaCollection } from '@/lib/firebaseUtils';

export default function MediaDisplay() {
  const { currentMedia, deviceCode, logout: deviceLogout, isOffline, retryConnection, error } = useDevice();
  const { logOut: authLogout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [manualCheckResult, setManualCheckResult] = useState(null);

  useEffect(() => {
    // Reset loading state when media changes
    if (currentMedia) {
      console.log('Current media updated:', currentMedia);
      setIsLoading(true);
      setMediaError(null);
    } else {
      console.log('No current media available');
    }
  }, [currentMedia]);

  // Add debugging for device context
  useEffect(() => {
    console.log('Device context state:', {
      deviceCode,
      isOffline,
      hasCurrentMedia: !!currentMedia,
      error
    });
  }, [deviceCode, isOffline, currentMedia, error]);

  const handleMediaLoad = () => {
    setIsLoading(false);
  };

  const handleMediaError = () => {
    setIsLoading(false);
    setMediaError('Failed to load media content');
  };

  const handleRetryConnection = async () => {
    await retryConnection();
  };

  const handleLogout = async () => {
    // First logout from device
    await deviceLogout();
    // Then logout from Firebase auth
    await authLogout();
  };

  const handleManualCheck = async () => {
    try {
      console.log('Performing manual media check...');
      const result = await checkMediaCollection();
      console.log('Manual check result:', result);
      setManualCheckResult(result);
      
      // If we found media items for this device, log them
      if (result.success && result.items.length > 0) {
        const deviceItems = result.items.filter(item => 
          item.deviceCode === deviceCode
        );
        console.log('Media items for this device:', deviceItems);
      }
    } catch (error) {
      console.error('Error in manual check:', error);
      setManualCheckResult({ success: false, error: error.message });
    }
  };

  // Handle media type rendering
  const renderMedia = () => {
    console.log('Rendering media with:', { isOffline, currentMedia });
    
    if (isOffline) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="bg-yellow-800 text-yellow-100 p-6 rounded-lg max-w-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Connection Lost</h2>
            <p className="mb-4">Your device appears to be offline. Please check your internet connection.</p>
            <button
              onClick={handleRetryConnection}
              className="py-2 px-4 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    if (!currentMedia) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-2xl text-gray-300">Waiting for media content...</p>
          <p className="text-lg text-gray-400 mt-2">Your device is registered and ready to display content.</p>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleRetryConnection}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh Connection
            </button>
            <button
              onClick={handleManualCheck}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Check Media
            </button>
          </div>
          {manualCheckResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-md">
              <h3 className="text-lg font-bold mb-2">Media Check Result:</h3>
              <p>Success: {manualCheckResult.success ? 'Yes' : 'No'}</p>
              <p>Items found: {manualCheckResult.count || 0}</p>
              {manualCheckResult.error && <p className="text-red-500">Error: {manualCheckResult.error}</p>}
            </div>
          )}
        </div>
      );
    }

    // Extract fields from currentMedia, with fallbacks for different field names
    const type = currentMedia.fileType || currentMedia.type;
    const url = currentMedia.fileUrl || currentMedia.url;
    const title = currentMedia.title || '';
    
    console.log('Media content details:', { type, url, title });

    if (type === 'image') {
      // Check if the URL is the no-content image
      if (url === 'https://www.uira.net/SWS/pics/no-content-available.jpg') {
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              No content found 
              <h3 className="text-xl font-bold mb-2">No Content Available</h3>
              <p className="text-gray-400">The requested content is currently not available.</p>
            </div>
          </div>
        );
      }

      return (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <Image
            src={url}
            alt={title || 'Media content'}
            fill
            style={{ objectFit: 'contain' }}
            priority
            onLoad={handleMediaLoad}
            onError={handleMediaError}
          />
        </div>
      );
    } else if (type === 'video') {
      return (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <video
            src={url}
            className="w-full h-full"
            controls
            autoPlay
            loop
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-2xl text-red-500">Unsupported media type</p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header with device info */}
      <header className="flex justify-between items-center opacity-0">
        <div>
          <h1>Android TV App</h1>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-400">Device Code: {deviceCode}</p>
            {user && (
              <p className="text-sm text-gray-400">| User: {user.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {isOffline && (
            <span className="mr-4 px-2 py-1 bg-yellow-800 text-yellow-100 text-xs rounded-full">
              Offline
            </span>
          )}
          <button
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        {mediaError ? (
          <div className="text-red-500 text-2xl">{mediaError}</div>
        ) : error && !isOffline ? (
          <div className="text-red-500 text-2xl">{error}</div>
        ) : (
          renderMedia()
        )}
      </main>
      {/* Footer with media info if available */}
      {currentMedia && currentMedia.title && !isOffline && (
        <footer>
          <h2 className="text-sm ">{currentMedia.title}</h2>
          {currentMedia.description && (
            <p >{currentMedia.description}</p>
          )}
        </footer>
      )}
    </div>
  );
} 