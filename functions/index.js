const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

admin.initializeApp();

setGlobalOptions({ region: 'asia-south1' });

const client = new vision.ImageAnnotatorClient();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.analyzeComplaintImage = onDocumentCreated('complaints/{complaintId}', async (event) => {
    const snap = event.data;
    if (!snap) return;
    
    const data = snap.data();
    const imageUrl = data.imageUrl;

    if (!imageUrl) {
      console.log('No image URL provided');
      return;
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

      await snap.ref.update({
        priority,
        labels,
        aiAnalyzed: true,
        aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Vision API error:', error);
      await snap.ref.update({
        priority: 'Manual Review Needed',
        aiAnalyzed: false,
        aiError: error.message
      });
    }
});

exports.handleEmergencyRequest = onDocumentCreated('emergencies/{emergencyId}', async (event) => {
    const snap = event.data;
    if (!snap) return;
    
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
});

exports.handleComplaintUpdate = onDocumentUpdated('complaints/{complaintId}', async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

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
});
