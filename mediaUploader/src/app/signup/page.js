// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useForm } from 'react-hook-form';
// import { useAuth } from '../context/AuthContext';
// import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

// export default function Signup() {
//   const { signup } = useAuth();
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const { register, handleSubmit, watch, formState: { errors } } = useForm();
//   const password = watch('password', '');
  
//   const onSubmit = async (data) => {
//     try {
//       setError('');
//       setLoading(true);
//       await signup(data.email, data.password);
//       router.push('/dashboard');
//     } catch (error) {
//       if (error.code === 'auth/email-already-in-use') {
//         setError('Email is already in use. Please use a different email or sign in.');
//       } else {
//         setError('Failed to create an account. Please try again.');
//       }
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//             Create a new account
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             Or{' '}
//             <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
//               sign in to your existing account
//             </Link>
//           </p>
//         </div>
        
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
//             <span className="block sm:inline">{error}</span>
//           </div>
//         )}
        
//         <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
//           <div className="rounded-md shadow-sm -space-y-px">
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <FiMail className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 {...register('email', { 
//                   required: 'Email is required',
//                   pattern: {
//                     value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                     message: 'Invalid email address'
//                   }
//                 })}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//                 placeholder="Email address"
//               />
//               {errors.email && (
//                 <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
//               )}
//             </div>
            
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <FiLock className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 id="password"
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="new-password"
//                 {...register('password', { 
//                   required: 'Password is required',
//                   minLength: {
//                     value: 6,
//                     message: 'Password must be at least 6 characters'
//                   }
//                 })}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//                 placeholder="Password"
//               />
//               <div 
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? (
//                   <FiEyeOff className="h-5 w-5 text-gray-400" />
//                 ) : (
//                   <FiEye className="h-5 w-5 text-gray-400" />
//                 )}
//               </div>
//               {errors.password && (
//                 <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
//               )}
//             </div>
            
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <FiLock className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="new-password"
//                 {...register('confirmPassword', { 
//                   required: 'Please confirm your password',
//                   validate: value => value === password || 'Passwords do not match'
//                 })}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//                 placeholder="Confirm password"
//               />
//               {errors.confirmPassword && (
//                 <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
//               )}
//             </div>
//           </div>

//           <div>
//             <button
//               type="submit"
//               disabled={loading}
//               className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//             >
//               {loading ? 'Creating account...' : 'Sign up'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// } 