'use client';

export default function ErrorDisplay({ message, retry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg text-center">
        <div className="text-red-500 text-6xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-16 w-16 mx-auto">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        
        <p className="text-xl text-gray-300 mb-6">
          {message || 'An unexpected error occurred'}
        </p>
        
        {retry && (
          <button
            onClick={retry}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
} 