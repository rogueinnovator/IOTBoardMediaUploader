'use client';

import { useDevice } from '@/context/DeviceContext';
import RegistrationScreen from '@/components/RegistrationScreen';
import MediaDisplay from '@/components/MediaDisplay';
import { useEffect } from 'react';
import { setupTVNavigation, preventScreenSaver } from '@/utils/tvUtils';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  const { isRegistered } = useDevice();

  // Add TV-specific optimizations
  useEffect(() => {
    // Set up TV navigation for remote control
    setupTVNavigation();
    
    // Only prevent screen saver when registered and displaying media
    if (isRegistered) {
      preventScreenSaver();
    }
    
    // Add Android TV specific meta tags
    const addTVMetaTags = () => {
      // Add viewport meta tag for TV
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      
      // Add TV app meta tag
      const tvAppMeta = document.createElement('meta');
      tvAppMeta.setAttribute('name', 'tv:app');
      tvAppMeta.setAttribute('content', 'true');
      document.head.appendChild(tvAppMeta);
    };
    
    addTVMetaTags();
  }, [isRegistered]);

  return (
    <ProtectedRoute>
      {isRegistered ? <MediaDisplay /> : <RegistrationScreen />}
    </ProtectedRoute>
  );
}
