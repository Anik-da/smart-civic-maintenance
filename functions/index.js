const functions = require('firebase-functions');
const { firestore } = require('firebase-functions/v1');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

admin.initializeApp();

const client = new vision.ImageAnnotatorClient();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.analyzeComplaintImage = firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const imageUrl = data.imageUrl;

    if (!imageUrl) {
      console.log('No image URL provided');
      return null;
    }

    try {
      const [result] = await client.labelDetection(imageUrl);
      const labels = result.labelAnnotations.map(label => label.description.toLowerCase());
      
      let priority = 'Low';
      const highPriorityKeywords = ['fire', 'accident', 'blood', 'crash', 'danger', 'hazard', 'smoke', 'flood'];
      const mediumPriorityKeywords = ['pothole', 'broken', 'trash', 'garbage', 'damage', 'spill', 'graffiti'];

      if (labels.some(label => highPriorityKeywords.includes(label))) {
        priority = 'High';
      } else if (labels.some(label => mediumPriorityKeywords.includes(label))) {
        priority = 'Medium';
      }

      return snap.ref.update({
        priority,
        labels,
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

exports.handleEmergencyRequest = firestore
  .document('emergencies/{emergencyId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const userId = data.userId;

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().fcmToken) {
      const fcmToken = userDoc.data().fcmToken;
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Emergency Help Requested',
            body: 'Responders have been alerted.'
          }
        });
      } catch (err) {
        console.error('Failed to send FCM:', err);
      }
    }

    await delay(5000);
    await snap.ref.update({ status: 'Dispatched' });
    
    return null;
  });

exports.handleComplaintUpdate = firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

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
        } catch (err) {
          console.error('Failed to send feedback FCM:', err);
        }
      }
    }
    return null;
  });
