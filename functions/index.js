const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

admin.initializeApp();

const client = new vision.ImageAnnotatorClient();

exports.analyzeComplaintImage = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const imageUrl = data.imageUrl;

    if (!imageUrl) {
      console.log('No image URL provided');
      return null;
    }

    try {
      // Analyze the image using Google Cloud Vision
      const [result] = await client.labelDetection(imageUrl);
      const labels = result.labelAnnotations.map(label => label.description.toLowerCase());
      
      console.log('Detected labels:', labels);

      let priority = 'Low';
      const highPriorityKeywords = ['fire', 'accident', 'blood', 'crash', 'danger', 'hazard', 'smoke', 'flood'];
      const mediumPriorityKeywords = ['pothole', 'broken', 'trash', 'garbage', 'damage', 'spill', 'graffiti'];

      if (labels.some(label => highPriorityKeywords.includes(label))) {
        priority = 'High';
      } else if (labels.some(label => mediumPriorityKeywords.includes(label))) {
        priority = 'Medium';
      }

      // Update the Firestore document with labels and priority
      return snap.ref.update({
        priority: priority,
        labels: labels,
        aiAnalyzed: true,
        aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Vision API error:', error);
      return snap.ref.update({
        priority: 'Manual Review Needed',
        aiAnalyzed: false,
        aiError: error.message
      });
    }
  });

// Simulated Emergency Responder
exports.handleEmergencyRequest = functions.firestore
  .document('emergencies/{emergencyId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const userId = data.userId;

    console.log(`Emergency received for user ${userId}. Dispatching simulated responders.`);

    // 1. In a real app, send FCM to responder topic here.
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().fcmToken) {
      const fcmToken = userDoc.data().fcmToken;
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Emergency Help Requested',
            body: 'Responders have been alerted and are analyzing your location.'
          }
        });
      } catch (err) {
        console.error('Failed to send FCM:', err);
      }
    }

    // 2. Simulate dispatch delay (e.g. 5 seconds for demo)
    setTimeout(async () => {
      await snap.ref.update({ status: 'Dispatched' });
      
      if (userDoc.exists && userDoc.data().fcmToken) {
         admin.messaging().send({
           token: userDoc.data().fcmToken,
           notification: {
             title: 'Responders Dispatched',
             body: 'Help is on the way to your exact location.'
           }
         }).catch(console.error);
      }
    }, 10000); // 10 seconds

    // 3. Simulate arrival delay
    setTimeout(async () => {
      await snap.ref.update({ status: 'Arrived' });
    }, 25000); // 25 seconds

    return null;
  });

// Send FCM notification when Operator adds Feedback
exports.handleComplaintUpdate = functions.firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if feedback was added or changed
    if (afterData.operatorFeedback && beforeData.operatorFeedback !== afterData.operatorFeedback) {
      const userId = afterData.userId;
      
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data().fcmToken) {
        try {
          await admin.messaging().send({
            token: userDoc.data().fcmToken,
            notification: {
              title: `Update on your ${afterData.category || 'complaint'} issue`,
              body: `Operator Feedback: ${afterData.operatorFeedback}`
            }
          });
          console.log(`Feedback notification sent to user ${userId}`);
        } catch (err) {
          console.error('Failed to send feedback FCM:', err);
        }
      }
    }
    return null;
  });

