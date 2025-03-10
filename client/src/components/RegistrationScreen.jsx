'use client';

import { useState } from 'react';
import { useDevice } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RegistrationScreen() {
  const { register, loading, error, isOffline, retryConnection, isInitialized, hasRuleIssue, hasAuthError } = useDevice();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!code || code.trim() === '') {
      setInputError('Please enter a valid code');
      return;
    }
    
    // Clear any previous errors
    setInputError('');
    
    // Attempt to register
    await register(code);
  };

  const handleRetry = async () => {
    if (code) {
      await register(code);
    } else {
      await retryConnection();
    }
  };

  // Show loading state during initialization
  if (loading && !isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <h1 className="text-2xl font-bold mt-4">Initializing Firebase</h1>
          <p className="text-gray-300">Please wait while we connect to the server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Android TV App</h1>
          <p className="text-xl text-gray-300">Enter your unique code to register this device</p>
          {user && (
            <p className="text-sm text-gray-400 mt-2">Signed in as: {user.email}</p>
          )}
        </div>
        
        {!isInitialized && !hasRuleIssue && !hasAuthError && (
          <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-4">
            <p className="font-bold">Firebase Initialization Failed</p>
            <p className="text-sm mt-1">Unable to connect to Firebase. Please check your internet connection and Firebase configuration.</p>
            <button
              onClick={handleRetry}
              disabled={loading}
              className="mt-2 w-full py-2 px-4 bg-red-700 hover:bg-red-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              {loading ? 'Trying to reconnect...' : 'Retry Initialization'}
            </button>
          </div>
        )}
        
        {hasAuthError && (
          <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-4">
            <p className="font-bold">Authentication Required</p>
            <p className="text-sm mt-1">
              You must be signed in to register a device. Please sign in or create an account.
            </p>
            <div className="flex space-x-2 mt-2">
              <Link 
                href="/signin"
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
        
        {hasRuleIssue && (
          <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-4">
            <p className="font-bold">Firebase Security Rules Issue</p>
            <p className="text-sm mt-1">
              The app is unable to access Firebase due to security rules or API key restrictions. 
              This is a configuration issue that needs to be fixed by the app administrator.
            </p>
            <div className="mt-2 text-xs bg-red-900 p-2 rounded">
              <p className="font-bold">Technical Details:</p>
              <p>Error 400: WebChannelConnection RPC 'Listen' stream transport error</p>
              <p className="mt-1">Possible causes:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Firestore security rules are too restrictive</li>
                <li>API key restrictions are blocking access</li>
                <li>Firebase project configuration issues</li>
              </ul>
            </div>
            <button
              onClick={handleRetry}
              disabled={loading}
              className="mt-2 w-full py-2 px-4 bg-red-700 hover:bg-red-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              {loading ? 'Trying to reconnect...' : 'Retry Connection'}
            </button>
          </div>
        )}
        
        {isInitialized && isOffline && !hasRuleIssue && !hasAuthError && (
          <div className="bg-yellow-800 text-yellow-100 p-4 rounded-lg mb-4">
            <p className="font-bold">Network Connection Issue</p>
            <p className="text-sm mt-1">Your device appears to be offline. Please check your internet connection.</p>
            <button
              onClick={handleRetry}
              disabled={loading}
              className="mt-2 w-full py-2 px-4 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            >
              {loading ? 'Trying to reconnect...' : 'Retry Connection'}
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="code" className="sr-only">Device Code</label>
            <input
              id="code"
              name="code"
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-4 border border-gray-700 bg-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading || !isInitialized || hasRuleIssue || hasAuthError}
              autoFocus
              autoComplete="off"
            />
          </div>
          
          {(inputError || error) && isInitialized && !isOffline && !hasRuleIssue && !hasAuthError && (
            <div className="text-red-500 text-center">
              {inputError || error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading || !isInitialized || isOffline || hasRuleIssue || hasAuthError}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xl font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Device'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>This device will be registered to receive media content.</p>
          {!user && (
            <p className="mt-2">
              <Link href="/signin" className="text-blue-400 hover:text-blue-300">Sign in</Link> or <Link href="/signup" className="text-blue-400 hover:text-blue-300">create an account</Link> to register a device.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 