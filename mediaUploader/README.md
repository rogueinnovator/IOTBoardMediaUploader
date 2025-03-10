# Iot based solar powered digital board

A Next.js application for uploading and managing images and videos with Firebase integration. This project includes user authentication and secure storage of media files.

## Features

- User authentication with Firebase Authentication
- Upload and store images and videos
- View and manage uploaded media
- Responsive design with Tailwind CSS
- Secure storage with Firebase Storage
- **Media expiration**: Set expiration dates for media content, after which it will be automatically replaced with a "No Content Available" image
- **Cloud Functions**: Automated background processes to handle expired media

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.x or later)
- npm or yarn
- A Firebase account
- Firebase CLI (for deploying Cloud Functions)

## Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Set up Firebase Authentication with Email/Password provider
4. Create a Firebase Storage bucket
5. Create a Firestore database
6. Get your Firebase configuration from Project Settings > General > Your apps > SDK setup and configuration
7. Enable Cloud Functions if you want to use the media expiration feature

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd media-upload-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Cloud Functions

This project includes Firebase Cloud Functions to handle media expiration:

1. Navigate to the functions directory:
```bash
cd functions
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the functions:
```bash
npm run deploy
```

For more information, see the [functions README](./functions/README.md).

## Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/src/app`: Main application code
  - `/components`: Reusable UI components
  - `/context`: React context for state management
  - `/firebase`: Firebase configuration and utilities
  - `/login`: Login page
  - `/signup`: Signup page
  - `/dashboard`: Dashboard for authenticated users

## Deployment

This application can be deployed to Vercel, Netlify, or any other platform that supports Next.js applications.

For Vercel deployment:

```bash
npm install -g vercel
vercel
```

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
