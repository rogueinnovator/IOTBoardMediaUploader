'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiUpload, FiLogIn, FiUserPlus, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from './context/AuthContext';
import Dashboard from './dashboard/page';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Uncomment this line to automatically redirect to login page
    // router.push('/login');
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ backgroundImage: 'url(https://www.uetmardan.edu.pk/uetm/assets/homeimages/02-min.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Iot based solar powered digital board app</h1>
          <div className="flex space-x-4">
            {user ? (
              <>
                <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                  <FiUser className="mr-2 text-indigo-600" />
                  <span>Welcome, {user.displayName || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
                {/* <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Dashboard
                </Link> */}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiLogIn className="mr-2" />
                  Login
                </Link>
                {/* <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiUserPlus className="mr-2" />
                  Sign Up
                </Link> */}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl w-full text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            University of engineering and technology mardan
          </h2>
          <p className="text-4xl font-bold mb-8 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent animate-pulse">
            A project by <span className="font-bold">Hamza Ayoub</span> • <span className="font-bold">Khizar Ali</span> • <span className="font-bold"> Kamran Khan</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Dashboard
            </Link>
            {/* <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create an Account
            </Link> */}
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Iot based solar powered digital board. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
