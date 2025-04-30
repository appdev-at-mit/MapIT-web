const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for individual rooms within a floor
const RoomSchema = new Schema({
  roomNumber: { type: String, required: true },
  // GeoJSON Point format for location
  location: {
    type: {
      type: String,
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number], // Array of numbers for longitude and latitude
      required: true,
      index: '2dsphere' // Create a geospatial index for efficient queries
    }
  },
  // Add other room-specific properties if needed (e.g., name, capacity)
});

// Schema for individual floors within a building
const FloorSchema = new Schema({
  floorId: { type: String, required: true, unique: true }, // e.g., 'floor-0', 'floor-1'
  name: { type: String, required: true }, // e.g., 'Floor 1', 'Basement'
  // Array of embedded room documents
  rooms: [RoomSchema],
  // Add other floor-specific properties if needed (e.g., floor plan image URL?)
});

// Schema for buildings
const BuildingSchema = new Schema({
  // Using a simple identifier, could be a number or string like 'evans-hall'
  buildingIdentifier: { type: String, required: true, unique: true, index: true }, 
  name: { type: String, required: true }, // e.g., 'Evans Hall', 'Building 7'
  // Array of embedded floor documents
  floors: [FloorSchema],
  // Add other building-specific properties if needed (e.g., address, main entrance coords)
});

// Add unique compound index if needed, e.g., ensure room numbers are unique per floor
// FloorSchema.index({ floorId: 1, 'rooms.roomNumber': 1 }, { unique: true }); 
// ^ Consider implications if multiple rooms can share a number (unlikely but possible)

const Building = mongoose.model('Building', BuildingSchema);

module.exports = Building; 