/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

router.get("/test", (req, res) => {
  console.debug('HERE');
  return res.status(200).json({msg: 'ok'});
});

router.get("/class", (req, res) => {

  const searchText = req.query.subjectId;

  const subjectNumRegex = /[a-zA-Z0-9]{1,3}.[a-zA-Z0-9]{1,4}$/;

  if (!subjectNumRegex.test(searchText)) {
      res.status(404).send({ msg: 'Class not found'});
  } 

  fetch(`https://fireroad-dev.mit.edu/courses/lookup/${searchText}?full=true`)
  .then((response) => {
      if (response.ok) { return response.json(); }
      else {throw new Error(`cannot retrieve class: response ${response.status}`)}
  })
  .then((classInfo) => {
      if (!classInfo['schedule']) {
          console.log(`Found ${searchText}, but no schedule`);
          res.status(200).json({ class: searchText, schedule: '' });
          return;
      }
      const scheduleStr = classInfo['schedule'];
      res.status(200).json({ class: searchText, schedule: scheduleStr });
      // parseSchdule(scheduleStr);
  }).catch((e) => {
    res.status(404).send({ msg: 'Class not found'});
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
