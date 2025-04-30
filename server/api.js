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
const Building = require("./models/Building");

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

// POST endpoint to add/update rooms for a specific floor in a building
router.post("/buildings/:buildingIdentifier/floors/:floorIdentifier/rooms", async (req, res) => {
  // Simple auth check - replace with proper authorization if needed
  // if (!req.user) { 
  //   return res.status(401).send({ msg: "Unauthorized" });
  // }
  
  const { buildingIdentifier, floorIdentifier } = req.params;
  const roomsData = req.body; // Expecting an array of room objects

  // Validate input
  if (!Array.isArray(roomsData) || roomsData.length === 0) {
    return res.status(400).send({ msg: "Request body must be a non-empty array of rooms." });
  }
  
  // --- Data transformation and validation (basic example) ---
  let roomsToInsert = [];
  try {
    roomsToInsert = roomsData.map(room => {
      if (!room.roomNumber || !room.lng || !room.lat) {
        throw new Error(`Invalid room data: ${JSON.stringify(room)}. Requires roomNumber, lng, lat.`);
      }
      return {
        roomNumber: String(room.roomNumber),
        location: {
          type: 'Point',
          coordinates: [parseFloat(room.lng), parseFloat(room.lat)]
        }
        // Add any other fields from RoomSchema here
      };
    });
  } catch (error) {
    console.error("Error parsing room data:", error.message);
    return res.status(400).send({ msg: `Error parsing room data: ${error.message}` });
  }
  // --- End data transformation ---

  try {
    // Find the building or create it if it doesn't exist (upsert)
    let building = await Building.findOne({ buildingIdentifier: buildingIdentifier });

    if (!building) {
      // Basic building creation - you might want more details
      console.log(`Building ${buildingIdentifier} not found, creating...`);
      building = new Building({
        buildingIdentifier: buildingIdentifier,
        name: `Building ${buildingIdentifier}`, // Placeholder name
        floors: []
      });
    }

    // Find the floor within the building
    let floor = building.floors.find(f => f.floorId === floorIdentifier);

    if (floor) {
      console.log(`Floor ${floorIdentifier} found in Building ${buildingIdentifier}. Adding rooms...`);
      // Floor exists, add new rooms (simple push, consider checking duplicates later)
      // TODO: Add logic to prevent duplicate room numbers on the same floor if needed
      floor.rooms.push(...roomsToInsert);
    } else {
      console.log(`Floor ${floorIdentifier} not found in Building ${buildingIdentifier}. Creating floor and adding rooms...`);
      // Floor doesn't exist, create it with the new rooms
      building.floors.push({
        floorId: floorIdentifier,
        name: `Floor ${floorIdentifier.split('-')[1]}`, // Placeholder name like 'Floor 1'
        rooms: roomsToInsert
      });
    }

    // Save the updated or new building document
    const savedBuilding = await building.save();
    
    console.log(`Successfully added/updated rooms for Building ${buildingIdentifier}, Floor ${floorIdentifier}`);
    // Return the updated floor or building data (optional)
    res.status(200).send(savedBuilding.floors.find(f => f.floorId === floorIdentifier)); 

  } catch (error) {
    console.error("Error updating/creating building data:", error);
    res.status(500).send({ msg: "Server error while saving building data.", error: error.message });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
