const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Fallback image URL for expired or deleted content
const NO_CONTENT_IMAGE_URL = 'https://www.uira.net/SWS/pics/no-content-available.jpg';

/**
 * Cloud Function that runs every hour to check for expired media
 * When media expires, it updates the fileUrl to the fallback "no content available" image
 */
exports.checkExpiredMedia = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  
  try {
    console.log('Running checkExpiredMedia function at:', now.toDate());
    
    // Query for media items that have expired but haven't been processed yet
    const expiredMediaQuery = await db.collection('media')
      .where('expiresAt', '<=', now)
      .where('expired', '==', false)
      .get();
    
    if (expiredMediaQuery.empty) {
      console.log('No expired media found');
      return null;
    }
    
    console.log(`Found ${expiredMediaQuery.size} expired media items`);
    
    // Process each expired media item
    const batch = db.batch();
    const deletePromises = [];
    
    expiredMediaQuery.forEach(doc => {
      const mediaData = doc.data();
      console.log(`Processing expired media: ${doc.id}, title: ${mediaData.title}, expires: ${mediaData.expiresAt.toDate()}`);
      
      // Delete the file from storage if it exists
      if (mediaData.filePath) {
        const fileRef = storage.bucket().file(mediaData.filePath);
        deletePromises.push(
          fileRef.delete()
            .then(() => {
              console.log(`Successfully deleted file: ${mediaData.filePath}`);
            })
            .catch(error => {
              // Ignore errors if file doesn't exist
              console.log(`Error deleting file ${mediaData.filePath}:`, error);
            })
        );
      }
      
      // Update the document with the fallback image URL
      batch.update(doc.ref, {
        fileUrl: NO_CONTENT_IMAGE_URL,
        fileType: 'image',
        expired: true,
        expiredAt: now
      });
    });
    
    // Wait for all delete operations to complete
    await Promise.all(deletePromises);
    
    // Commit the batch update
    await batch.commit();
    
    console.log('Successfully processed expired media');
    return null;
  } catch (error) {
    console.error('Error processing expired media:', error);
    return null;
  }
});

/**
 * Cloud Function that triggers when a new media item is created
 * Sets up a scheduled task to delete the media when it expires
 */
exports.onMediaCreated = functions.firestore
  .document('media/{mediaId}')
  .onCreate(async (snapshot, context) => {
    const mediaData = snapshot.data();
    const mediaId = context.params.mediaId;
    
    // If there's no expiration date, do nothing
    if (!mediaData.expiresAt) {
      console.log(`Media ${mediaId} has no expiration date`);
      return null;
    }
    
    // Ensure the expired flag is set to false for new media
    if (mediaData.expired === undefined) {
      await snapshot.ref.update({ expired: false });
    }
    
    console.log(`Media ${mediaId} will expire at ${mediaData.expiresAt.toDate()}`);
    
    // The checkExpiredMedia function will handle the actual expiration
    return null;
  });

/**
 * Cloud Function that triggers when a media item is deleted
 * This function is used to clean up the storage file when a media document is deleted
 */
exports.onMediaDeleted = functions.firestore
  .document('media/{mediaId}')
  .onDelete(async (snapshot, context) => {
    const mediaData = snapshot.data();
    const mediaId = context.params.mediaId;
    
    console.log(`Media ${mediaId} was deleted from Firestore`);
    
    // If there's a file path, delete the file from storage
    if (mediaData.filePath) {
      try {
        const fileRef = storage.bucket().file(mediaData.filePath);
        await fileRef.delete();
        console.log(`Successfully deleted file: ${mediaData.filePath}`);
      } catch (error) {
        console.log(`Error deleting file ${mediaData.filePath}:`, error);
      }
    }
    
    return null;
  }); 