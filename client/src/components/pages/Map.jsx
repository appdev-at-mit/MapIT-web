import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiaGFpbGV5cGFuIiwiYSI6ImNtMmk1aTAzdTBqaXgya3EzczBuOTU0b3QifQ.Vfmnzm0EW8Z-3Dp3PhE8Aw";

// Store this outside the component or fetch it from an API
// Use the same coordinates for all floors
const floorPlanCoordinates = [
  [-71.09280847435501, 42.35834378834414], // Top-left corner
  [-71.0921528451442, 42.358555201973275], // Top-right corner
  [-71.09166243795372, 42.35795523299731], // Bottom-right corner
  [-71.0924304232804, 42.35770468531794]  // Bottom-left corner
];

const floorPlans = [
  { id: 'floor-0', name: 'Floor 0', url: '/floor_plans/1_0.png', coordinates: floorPlanCoordinates },
  { id: 'floor-1', name: 'Floor 1', url: '/floor_plans/1_1.png', coordinates: floorPlanCoordinates }, // Default floor
  { id: 'floor-2', name: 'Floor 2', url: '/floor_plans/1_2.png', coordinates: floorPlanCoordinates },
  { id: 'floor-3', name: 'Floor 3', url: '/floor_plans/1_3.png', coordinates: floorPlanCoordinates },
  { id: 'floor-4', name: 'Floor 4', url: '/floor_plans/1_4.png', coordinates: floorPlanCoordinates },
];

const defaultFloorId = 'floor-1';

// Calculates a simple rectangular bounding box from the corner coordinates
const getBounds = (coordinates) => {
  const lats = coordinates.map(c => c[1]);
  const lngs = coordinates.map(c => c[0]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
};

// Calculate bounds for the first floor plan
const buildingBounds = getBounds(floorPlans[0].coordinates);

const isPointInBounds = (point, bounds) => {
  const [lng, lat] = point;
  const [sw, ne] = bounds;
  return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
};

const FloorSelectorPopup = ({ currentFloor, floors, onSelectFloor, popupInstance }) => {
  const handleSelect = (floorId) => {
    onSelectFloor(floorId);
    if (popupInstance) {
      popupInstance.remove();
    }
  };

  return (
    <div className="p-1">
      <h4 className="text-sm font-semibold mb-1 text-center">Select Floor</h4>
      <div className="flex flex-col space-y-1">
        {floors.map(floor => (
          <button
            key={floor.id}
            onClick={() => handleSelect(floor.id)}
            className={`block w-full text-center px-3 py-1 text-xs rounded ${
              currentFloor === floor.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [currentFloorId, _setCurrentFloorId] = useState(defaultFloorId);
  const popupRef = useRef(null);

  const currentFloorIdRef = useRef(currentFloorId);

  const setCurrentFloorId = (newFloorId) => {
    currentFloorIdRef.current = newFloorId;
    _setCurrentFloorId(newFloorId);
  };

  useEffect(() => {
    currentFloorIdRef.current = currentFloorId;
  }, [currentFloorId]);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
      return;
    }
    floorPlans.forEach(floor => {
      const layerId = `${floor.id}-layer`;
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(
          layerId,
          'visibility',
          floor.id === currentFloorId ? 'visible' : 'none'
        );
      }
    });
  }, [currentFloorId]);

  useEffect(() => {
    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-71.09223, 42.35815],
      zoom: 18,
    });

    window.mapboxMap = mapRef.current;
    
    // Add geolocate control to the map.
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      })
    );

    // Handle map click to add a marker
    const handleMapClick = (e) => {
      const { lng, lat } = e.lngLat;

      // Close existing popup if any
      if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
      }

      // Get the latest floor ID from the ref (still useful for context)
      const latestFloorId = currentFloorIdRef.current;

      // --- TEMP: Always add Lat/Lon marker --- H
      console.log(`Clicked Coords: Lng: ${lng.toFixed(6)}, Lat: ${lat.toFixed(6)} (Floor Context: ${latestFloorId})`);

      const newMarker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setText(
            // Display just the coordinates
            `Lng: ${lng.toFixed(6)}, Lat: ${lat.toFixed(6)}`
          )
        )
        .addTo(mapRef.current);

      // Optional: Still save marker data if needed for cleanup or other purposes
      // Using the original `markers` state name temporarily
      setMarkers((prevMarkers) => [...prevMarkers, { lng, lat, floor: latestFloorId, marker: newMarker }]);
      // --- END TEMP --- H

      /* --- ORIGINAL FLOOR SWITCHING & ROOM MARKING LOGIC (Commented Out) --- H
      // Check if click is within building bounds
      if (isPointInBounds([lng, lat], buildingBounds)) {
        // Click is inside the building: Show floor selector popup

        // 1. Create a container element for the React component
        const popupContainer = document.createElement('div');

        // 2. Create the Mapbox popup - Added className
        const popup = new mapboxgl.Popup({
             closeOnClick: true,
             offset: 15,
             className: 'floor-selector-popup' // Add custom class for potential styling
          })
          .setLngLat(e.lngLat)
          .setDOMContent(popupContainer) // Set the container as the content
          .addTo(mapRef.current);

        popupRef.current = popup; // Store reference to the popup

        // 3. Render the React component into the container
        ReactDOM.render(
          <FloorSelectorPopup
            currentFloor={latestFloorId}
            floors={floorPlans}
            onSelectFloor={setCurrentFloorId}
            popupInstance={popup}
          />,
          popupContainer
        );
         // Remove popup reference when it's closed
         popup.on('close', () => {
            popupRef.current = null;
         });

         // Room prompt logic (also commented out)
         /*
         setTimeout(() => {
           const roomNumber = window.prompt(`Enter room number for location on ${latestFloorId}:`);
           if (roomNumber && roomNumber.trim() !== "") {
             const roomName = roomNumber.trim();
             console.log(`Saving room: ${roomName}, Floor: ${latestFloorId}, Lng: ${lng}, Lat: ${lat}`);
             const roomMarker = new mapboxgl.Marker({ color: '#FF0000' })
               .setLngLat([lng, lat])
               .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`Room: ${roomName} (${latestFloorId})`))
               .addTo(mapRef.current);
             const newLocation = { id: `room-${Date.now()}`, type: 'room', room: roomName, floor: latestFloorId, lng, lat, marker: roomMarker };
             setSavedLocations(prevLocations => [...prevLocations, newLocation]);
           } else {
             console.log("Room marking cancelled.");
           }
         }, 50);
         * /

      } else {
        // Click is outside the building: Add a marker (original behavior)
        console.log(`Clicked coordinates (Outside Building): Lng: ${lng}, Lat: ${lat}, Floor Context: ${latestFloorId}`);
        const newMarker = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setText(
              `Marker at Lng: ${lng.toFixed(6)}, Lat: ${lat.toFixed(6)}`
            )
          )
          .addTo(mapRef.current);

        // Still associate marker with the currently selected floor for potential saving
        setMarkers((prevMarkers) => [...prevMarkers, { lng, lat, floor: latestFloorId, marker: newMarker }]);
      }
      */ // --- END ORIGINAL LOGIC --- H
    };

    mapRef.current.on("click", handleMapClick);

    // --- Load all floor plan images on map load ---
    mapRef.current.on('load', () => {
      floorPlans.forEach(floor => {
        const sourceId = `${floor.id}-source`;
        const layerId = `${floor.id}-layer`;

        // Add source for the floor plan image
        mapRef.current.addSource(sourceId, {
          type: 'image',
          url: floor.url,
          coordinates: floor.coordinates
        });

        // Add layer to display the image
        mapRef.current.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': 0.9,
            'raster-fade-duration': 0
          },
          layout: {
            visibility: floor.id === currentFloorIdRef.current ? 'visible' : 'none'
          }
        });
      });

       floorPlans.forEach(floor => {
        const layerId = `${floor.id}-layer`;
        if (mapRef.current.getLayer(layerId)) {
            mapRef.current.setLayoutProperty(
            layerId,
            'visibility',
            floor.id === currentFloorId ? 'visible' : 'none'
            );
         }
        });

    }); // End map.on('load')

    // Cleanup on unmount
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <style>{`
        .floor-selector-popup .mapboxgl-popup-content {
          padding: 8px; /* Add padding around the content */
        }
        .floor-selector-popup .mapboxgl-popup-close-button {
          /* Optional: Slightly adjust button position if needed */
          /* right: 2px; */
          /* top: 2px; */
          font-size: 1.1rem; /* Make 'x' slightly larger if desired */
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default Map;
