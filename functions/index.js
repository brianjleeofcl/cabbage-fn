const functions = require('firebase-functions');

const moment = require('moment');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.frequency = functions.https.onRequest((req, res) => {
  const dateValues = {
    all: null,
    year: { years: 1 },
    month: { months: 1 },
    week: { weeks: 1 }
  }
  const { date } = req.query

  if (dateValues[date] === undefined) {
    res.status(400)
    res.send('Invalid paramenter')
  }

  const targetTime = date === 'all' ? 0 : +moment().subtract(dateValues[date]);

  admin.database().ref('/scores').orderByKey().startAt(targetTime.toString()).once('value').then(snap => {
    const map = {};

    snap.forEach(childSnap => {
      const score = childSnap.val()
      map[score] = (map[score] || 0) + 1; 
    });
    
    res.send(map);
  })
})