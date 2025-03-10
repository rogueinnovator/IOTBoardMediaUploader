# Android TV Next.js App with Firebase

This is a Next.js application designed to run on Android TV devices. It uses Firebase for real-time updates and media display.

## Features

- Device registration with unique codes
- Real-time media updates from Firebase
- Support for displaying images and videos
- Optimized for Android TV (remote navigation, screen saver prevention)
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js 18.x or later
- Firebase account with Firestore database
- Android TV device or emulator

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Firestore database
   - Create two collections: `devices` and `media`
   - Get your Firebase configuration from Project Settings > General > Your apps > Web app

4. Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

5. Run the development server:

```bash
npm run dev
```

6. Build for production:

```bash
npm run build
```

7. Start the production server:

```bash
npm start
```

## Deploying to Android TV

1. Build the application for production:

```bash
npm run build
```

2. Deploy the application to a hosting service like Vercel, Netlify, or Firebase Hosting.

3. On your Android TV device, open the web browser and navigate to your deployed application URL.

4. For a better experience, you can create a WebView Android app that loads your deployed URL and install it on your Android TV.

## Firebase Data Structure

### Devices Collection

Each document in the `devices` collection represents a registered TV device:

```javascript
{
  "code": "unique-device-code",
  "registeredAt": Timestamp,
  "lastSeen": Timestamp,
  "status": "online" | "offline"
}
```

### Media Collection

Each document in the `media` collection represents media content to be displayed:

```javascript
{
  "code": "unique-device-code", // Must match a registered device code
  "type": "image" | "video",
  "url": "https://example.com/media-url",
  "title": "Media Title",
  "description": "Media Description",
  "timestamp": Timestamp // When to display this media
}
```

## Usage

1. Open the application on your Android TV device.
2. Enter a unique code to register the device.
3. The device will be registered in the Firebase `devices` collection.
4. Add documents to the `media` collection with the same code to display media on the TV.
5. The TV will automatically update when new media is added to Firebase.

## License

MIT
