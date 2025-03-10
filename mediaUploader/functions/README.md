# Media Uploader Cloud Functions

This directory contains Firebase Cloud Functions for the Media Uploader application.

## Functions

### checkExpiredMedia

This function runs every hour to check for expired media items. When a media item expires:

1. The original file is deleted from Firebase Storage
2. The media document is updated to point to the "No Content Available" image
3. The document is marked as expired

### onMediaCreated

This function triggers when a new media item is created. It logs information about the media's expiration date.

## Deployment

To deploy these functions to Firebase:

1. Make sure you have the Firebase CLI installed:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Navigate to the functions directory:
   ```
   cd functions
   ```

4. Install dependencies:
   ```
   npm install
   ```

5. Deploy the functions:
   ```
   npm run deploy
   ```

## Testing

You can test the functions locally using the Firebase Emulator:

```
npm run serve
```

## Logs

To view the logs for your deployed functions:

```
npm run logs
``` 