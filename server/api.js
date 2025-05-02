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
// const { get } = require("../../client/src/utilities"); // REMOVED: Cannot require client modules on server

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

// GET endpoint to retrieve all building data
router.get("/buildings", async (req, res) => {
  try {
    // Fetch all buildings and populate necessary details
    // Exclude large fields like room data if not needed for initial map load
    const buildings = await Building.find({}).select("buildingIdentifier name floors.floorId floors.name floors.imageUrl floors.cornerCoordinates"); 
    res.status(200).send(buildings);
  } catch (error) {
    console.error("Error fetching buildings:", error);
    res.status(500).send({ msg: "Server error while fetching building data.", error: error.message });
  }
});

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

// GET endpoint to search for a specific room (e.g., "1-136")
router.get("/rooms/search/:query", async (req, res) => {
  const { query } = req.params;

  // Basic parsing: Expects format like "Building-RoomNumber" (e.g., "1-136", "W20-500")
  // More robust parsing might be needed for different formats
  const parts = query.split('-');
  if (parts.length < 2) {
    return res.status(400).send({ msg: "Invalid search query format. Expected format: Building-RoomNumber (e.g., 1-136)" });
  }
  
  // Assume the last part is the room number, everything before is the building identifier
  const roomNumberQuery = parts.pop();
  const buildingIdentifierQuery = parts.join('-'); // Handle building identifiers with hyphens

  if (!buildingIdentifierQuery || !roomNumberQuery) {
     return res.status(400).send({ msg: "Invalid search query format after parsing." });
  }

  console.log(`Searching for Building: ${buildingIdentifierQuery}, Room: ${roomNumberQuery}`);

  try {
    // Use aggregation pipeline for efficient searching within nested arrays
    const result = await Building.aggregate([
      {
        $match: { buildingIdentifier: buildingIdentifierQuery } // Match the building first
      },
      {
        $unwind: "$floors" // Deconstruct the floors array
      },
      {
        $unwind: "$floors.rooms" // Deconstruct the rooms array within each floor
      },
      {
        // Match the specific room number within the unwound documents
        // Use a case-insensitive match if needed: $match: { "floors.rooms.roomNumber": { $regex: new RegExp(`^${roomNumberQuery}$`, 'i') } }
        $match: { "floors.rooms.roomNumber": roomNumberQuery }
      },
      {
        // Project only the necessary fields for the result
        $project: {
          _id: 0, // Exclude default MongoDB ID
          buildingIdentifier: "$buildingIdentifier",
          buildingName: "$name",
          floorId: "$floors.floorId",
          floorName: "$floors.name",
          roomNumber: "$floors.rooms.roomNumber",
          location: "$floors.rooms.location.coordinates" // Extract [lng, lat] array
        }
      }
    ]);

    if (result.length > 0) {
      // Found the room
      console.log("Found room:", result[0]);
      res.status(200).send(result[0]); // Send the first match (should ideally be unique)
    } else {
      // Room not found
      console.log(`Room ${query} not found.`);
      res.status(404).send({ msg: `Room ${query} not found.` });
    }

  } catch (error) {
    console.error("Error searching for room:", error);
    res.status(500).send({ msg: "Server error while searching for room.", error: error.message });
  }
});

// PUT endpoint to update details of a specific floor
router.put("/buildings/:buildingIdentifier/floors/:floorIdentifier/details", async (req, res) => {
  const { buildingIdentifier, floorIdentifier } = req.params;
  const { cornerCoordinates, imageUrl, name } = req.body; // Fields that can be updated

  // Basic validation on coordinates if provided
  if (cornerCoordinates) {
    if (!Array.isArray(cornerCoordinates) || cornerCoordinates.length !== 4 || 
        !cornerCoordinates.every(coord => Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')) {
      return res.status(400).send({ msg: "Invalid cornerCoordinates format. Expected Array[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]." });
    }
  }

  try {
    const building = await Building.findOne({ buildingIdentifier: buildingIdentifier });

    if (!building) {
      return res.status(404).send({ msg: `Building ${buildingIdentifier} not found.` });
    }

    // Find the index of the floor to update
    const floorIndex = building.floors.findIndex(f => f.floorId === floorIdentifier);

    if (floorIndex === -1) {
      return res.status(404).send({ msg: `Floor ${floorIdentifier} not found in Building ${buildingIdentifier}.` });
    }

    // Update allowed fields
    let updated = false;
    if (cornerCoordinates) {
      building.floors[floorIndex].cornerCoordinates = cornerCoordinates;
      updated = true;
    }
    if (imageUrl) {
      building.floors[floorIndex].imageUrl = imageUrl;
       updated = true;
    }
     if (name) {
      building.floors[floorIndex].name = name;
       updated = true;
    }
    
    if (!updated) {
        return res.status(400).send({ msg: "No valid fields provided for update (allowed: name, cornerCoordinates, imageUrl)." });
    }

    await building.save();
    console.log(`Updated details for Floor ${floorIdentifier} in Building ${buildingIdentifier}`);
    res.status(200).send(building.floors[floorIndex]); // Return updated floor

  } catch (error) {
    console.error(`Error updating floor details for ${buildingIdentifier}/${floorIdentifier}:`, error);
    res.status(500).send({ msg: "Server error while updating floor details.", error: error.message });
  }
});

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

  const baseUrl = "fireroad.mit.edu";
  fetch(`https://${baseUrl}/courses/lookup/${searchText}?full=true`)
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
