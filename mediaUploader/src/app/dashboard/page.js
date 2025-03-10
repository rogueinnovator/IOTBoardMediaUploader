"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Link from "next/link";
import { FiLogOut, FiUpload, FiImage, FiVideo, FiTrash2, FiClock } from "react-icons/fi";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { storage, db } from "../firebase/config";
import Image from "next/image";

// Add CountdownTimer component at the top of the file
const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expirationTime = new Date(expiresAt.seconds * 1000).getTime();
      const difference = expirationTime - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial calculation

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  return (
    <span className="text-xs text-orange-500 font-medium">
      {timeLeft}
    </span>
  );
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [expirationTime, setExpirationTime] = useState("");

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedDevice) {
      fetchMediaItems();
    }
  }, [user, selectedDevice]);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      const mediaRef = collection(db, "media");
      const q = query(
        mediaRef,
        where("userId", "==", user.uid),
        where("deviceCode", "==", selectedDevice),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const items = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if the media has expired based on current time
        const now = new Date();
        const expiresAt = data.expiresAt?.toDate();
        const isExpired = data.expired || (expiresAt && expiresAt <= now);

        // If the media has expired but the expired flag is not set, update it
        if (isExpired && !data.expired) {
          updateDoc(doc.ref, {
            expired: true,
            expiredAt: serverTimestamp(),
            fileUrl: "https://www.uira.net/SWS/pics/no-content-available.jpg",
            fileType: "image"
          });
        }

        items.push({
          id: doc.id,
          ...data,
          expired: isExpired // Use the calculated expiration status
        });
      });

      setMediaItems(items);
    } catch (error) {
      console.error("Error fetching media items:", error);
      setError("Failed to load your media items.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const devicesRef = collection(db, "devices");
      const devicesSnapshot = await getDocs(devicesRef);
      const devicesList = [];
      
      devicesSnapshot.forEach((doc) => {
        devicesList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setDevices(devicesList);
      if (devicesList.length > 0) {
        setSelectedDevice(devicesList[0].code);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      setError("Failed to load devices.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Determine file type
      if (selectedFile.type.startsWith("image/")) {
        setFileType("image");
      } else if (selectedFile.type.startsWith("video/")) {
        setFileType("video");
      } else {
        setFileType("");
        setFile(null);
        setError("Please select an image or video file.");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title for your media.");
      return;
    }

    if (!selectedDevice) {
      setError("Please select a device to display the media.");
      return;
    }
    
    if (!expirationDate || !expirationTime) {
      setError("Please set an expiration date and time for your media.");
      return;
    }
    
    // Combine date and time to create a timestamp
    const expirationTimestamp = new Date(`${expirationDate}T${expirationTime}`);
    
    // Check if the expiration date is in the future
    if (expirationTimestamp <= new Date()) {
      setError("Expiration time must be in the future.");
      return;
    }

    try {
      setError("");
      setIsUploading(true);

      // Create a reference to the file in Firebase Storage with a more organized path
      const storageRef = ref(
        storage,
        `uploads/${user.uid}/${Date.now()}_${file.name}`,
      );

      // Upload the file
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Listen for upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setError("Failed to upload file. Please try again.");
          setIsUploading(false);
        },
        async () => {
          try {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save media metadata to Firestore
            await addDoc(collection(db, "media"), {
              title,
              fileUrl: downloadURL,
              fileType,
              fileName: file.name,
              filePath: uploadTask.snapshot.ref.fullPath,
              userId: user.uid,
              deviceCode: selectedDevice,
              createdAt: serverTimestamp(),
              expiresAt: expirationTimestamp,
              fallbackImageUrl: "https://www.uira.net/SWS/pics/no-content-available.jpg"
            });

            // Reset form
            setTitle("");
            setFile(null);
            setFileType("");
            setProgress(0);
            setExpirationDate("");
            setExpirationTime("");
            setIsUploading(false);

            // Refresh media items
            fetchMediaItems();
          } catch (error) {
            console.error("Error saving to Firestore:", error);
            setError(
              "File uploaded but failed to save metadata. Please try again.",
            );
            setIsUploading(false);
          }
        },
      );
    } catch (error) {
      console.error("Error during upload:", error);
      setError("An error occurred during upload. Please try again.");
      setIsUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        // Delete file from Storage
        const storageRef = ref(storage, item.filePath);
        await deleteObject(storageRef);

        // Update the document with the fallback image instead of deleting it
        const docRef = doc(db, "media", item.id);
        await updateDoc(docRef, {
          fileUrl: "https://www.uira.net/SWS/pics/no-content-available.jpg",
          fileType: "image",
          expired: true,
          expiredAt: serverTimestamp(),
          originalFilePath: item.filePath, // Keep track of the original file path
          filePath: null // Clear the file path since the original file is deleted
        });

        // Update the local state
        setMediaItems(mediaItems.map(media => 
          media.id === item.id 
            ? {
                ...media,
                fileUrl: "https://www.uira.net/SWS/pics/no-content-available.jpg",
                fileType: "image",
                expired: true,
                expiredAt: new Date(),
                originalFilePath: item.filePath,
                filePath: null
              }
            : media
        ));
      } catch (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item. Please try again.");
      }
    }
  };

  const handleExpire = async (item) => {
    try {
      // Delete file from Storage
      const storageRef = ref(storage, item.filePath);
      await deleteObject(storageRef);

      // Update the document with the fallback image
      const docRef = doc(db, "media", item.id);
      await updateDoc(docRef, {
        fileUrl: "https://www.uira.net/SWS/pics/no-content-available.jpg",
        fileType: "image",
        expired: true,
        expiredAt: serverTimestamp(),
        originalFilePath: item.filePath,
        filePath: null
      });

      // Update the local state
      setMediaItems(mediaItems.map(media => 
        media.id === item.id 
          ? {
              ...media,
              fileUrl: "https://www.uira.net/SWS/pics/no-content-available.jpg",
              fileType: "image",
              expired: true,
              expiredAt: new Date(),
              originalFilePath: item.filePath,
              filePath: null
            }
          : media
      ));
    } catch (error) {
      console.error("Error handling expiration:", error);
      setError("Failed to process expired media.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
            <Link href="/" className="fixed left-3 bg-blue-500  p-2 rounded-xl">
              Home
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upload New Media
            </h2>

            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 text-black block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter a title for your media"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label
                  htmlFor="device"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select TV Screen
                </label>
                <select
                  id="device"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="mt-1 text-black block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isUploading}
                >
                  <option value="">Select a device</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.code}>
                      {device.code}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="expirationDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    <div className="flex items-center">
                      <FiClock className="mr-1" />
                      Expiration Date
                    </div>
                  </label>
                  <input
                    type="date"
                    id="expirationDate"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="mt-1 text-black block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="expirationTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    <div className="flex items-center">
                      <FiClock className="mr-1" />
                      Expiration Time
                    </div>
                  </label>
                  <input
                    type="time"
                    id="expirationTime"
                    value={expirationTime}
                    onChange={(e) => setExpirationTime(e.target.value)}
                    className="mt-1 text-black block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={isUploading}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      After the expiration time, this media will be automatically removed and replaced with a &quot;No Content Available&quot; image.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700"
                >
                  File (Image or Video)
                </label>
                <div className="mt-1 flex items-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <FiUpload className="mr-2" />
                      Select File
                    </span>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                      disabled={isUploading}
                    />
                  </label>
                  {file && (
                    <span className="ml-3 text-sm text-gray-500">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Uploading
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                      <div
                        style={{ width: `${progress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Your Media</h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                You haven&apos;t uploaded any media yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {mediaItems.map((item) => (
                  <li key={item.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                          {item.fileType === "image" ? (
                            <FiImage className="h-6 w-6 text-gray-500" />
                          ) : (
                            <FiVideo className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.fileName}
                          </p>
                          {item.expiresAt && !item.expired && (
                            <div className="flex items-center gap-2 mt-1">
                              <FiClock className="text-orange-500" />
                              <CountdownTimer 
                                expiresAt={item.expiresAt} 
                                onExpire={() => handleExpire(item)} 
                              />
                            </div>
                          )}
                          {item.expired && (
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded inline-block">
                                Content Expired
                              </p>
                              {item.expiredAt && (
                                <p className="text-xs text-gray-500">
                                  Expired on: {new Date(item.expiredAt.seconds * 1000).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View
                        </a>
                        {!item.expired && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      {item.expired ? (
                        <div className="relative">
                          <img
                            src={item.fileUrl}
                            alt="No Content Available"
                            className="h-48 w-auto object-contain rounded-md bg-gray-100"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-gray-500 text-sm bg-white/80 px-3 py-1 rounded">
                              Content Expired
                            </span>
                          </div>
                        </div>
                      ) : item.fileType === "image" ? (
                        <img
                          src={item.fileUrl}
                          alt={item.title}
                          className="h-48 w-auto object-cover rounded-md"
                        />
                      ) : (
                        <video
                          src={item.fileUrl}
                          controls
                          className="h-48 w-auto rounded-md"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
