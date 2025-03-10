export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500"></div>
      <p className="mt-4 text-xl">Loading...</p>
    </div>
  );
} 