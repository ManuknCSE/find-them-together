const admin = require('firebase-admin');

function initFirebase() {
  if (admin.apps.length) return admin;

  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });

  return admin;
}

module.exports = initFirebase;

