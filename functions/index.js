const functions = require('firebase-functions');

const moment = require('moment');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.frequency = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  const dateValues = {
    all: null,
    year: { years: 1 },
    month: { months: 1 },
    week: { weeks: 1 }
  }
  const { date } = req.query;
  const interval = +req.query.interval || 0;
  const groups = +req.query.groups

  if (dateValues[date] === undefined) {
    res.status(400)
    return res.send('Invalid paramenter')
  }

  const targetTime = date === 'all' ? 0 : +moment().subtract(dateValues[date]);

  admin.database().ref('/scores').orderByKey().startAt(targetTime.toString()).once('value').then(snap => {
    const map = {};

    snap.forEach(childSnap => {
      const score = childSnap.val()
      map[score] = (map[score] || 0) + 1; 
    });
    
    if (interval === 0) {
      return res.send(map);
    } 
    else if (isNaN(groups)) {
      res.status(400)
      return res.send('Invalid parameter');
    } 
    else {
      return res.send(transformMap(map, interval, groups));
    }
  })
})

function transformMap(map, interval, groups) {
  const keys = [];
  const values = [];

  let lastGroupRangeStart;

  for (let i = 0; i < groups - 1; i++) {
    const rangeStart = i * interval + 24;
    const rangeEnd = (i + 1) * interval + 23
    keys.push(`${rangeStart}-${rangeEnd}`);

    let sum = 0;
    for (let k = rangeStart; k <= rangeEnd; k++) {
      sum += (map[k] || 0);
      delete map[k];
    }
    values.push(sum);
    
    lastGroupRangeStart = rangeEnd;
  }
  lastGroupRangeStart += 1;
  keys.push(`${lastGroupRangeStart}+`);
  values.push(Object.keys(map).reduce((sum, key) => sum + map[key], 0));
  return { intervals: keys, aggregates: values };
}
