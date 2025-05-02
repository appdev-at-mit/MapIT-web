import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { get } from "../../utilities";

mapboxgl.accessToken =
  "pk.eyJ1IjoiaGFpbGV5cGFuIiwiYSI6ImNtMmk1aTAzdTBqaXgya3EzczBuOTU0b3QifQ.Vfmnzm0EW8Z-3Dp3PhE8Aw";

// calculates a simple rectangular bounding box from the corner coordinates
function getBounds(coordinates) {
  if (!coordinates || coordinates.length !== 4) {
      console.error("getBounds requires an array of 4 coordinate pairs.");
      return [[0,0], [0,0]];
  }
  const lats = coordinates.map(c => c[1]);
  const lngs = coordinates.map(c => c[0]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

function isPointInBounds(point, bounds) {
  if (!point || !bounds) return false;
  const [lng, lat] = point;
  const [sw, ne] = bounds;
  return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
}

const FloorSelectorPopup = ({ currentFloor, floors, onSelectFloor, popupInstance }) => {
  const handleSelect = (floorId) => {
    onSelectFloor(floorId);
    if (popupInstance) {
      popupInstance.remove();
    }
  };

  return (
    <div className="p-1">
      <h4 className="text-sm font-semibold mb-1 text-center">select floor</h4>
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
  const [tempMarkers, setTempMarkers] = useState([]);
  
  const [buildingsData, setBuildingsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentFloorId, _setCurrentFloorId] = useState(null);
  const popupRef = useRef(null);
  const currentFloorIdRef = useRef(currentFloorId);

  // fetch building and floor metadata on component mount
  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedData = await get("/api/buildings");
        
        if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
            throw new Error("no building data received from server.");
        }
        
        // restructure fetched data into a key-based object for easier lookup
        // also calculate bounds needed for interaction logic
        const processedData = {};
        fetchedData.forEach(building => {
            if (!building.buildingIdentifier) return;
            const key = `building-${building.buildingIdentifier}`;
            processedData[key] = {
                ...building,
                floors: building.floors.map(floor => ({
                    id: floor.floorId,
                    name: floor.name || `floor ${floor.floorId}`,
                    url: floor.imageUrl || '',
                    coordinates: floor.cornerCoordinates || [[0,0],[0,0],[0,0],[0,0]]
                })),
                bounds: getBounds(building.floors[0]?.cornerCoordinates)
            };
        });

        const placeholderCoordsB6 = [
          [-71.090838, 42.359884], // nw
          [-71.090501, 42.359987], // ne
          [-71.090050, 42.359274], // se
          [-71.090406, 42.359150]  // sw
        ];
        const tempBuilding6Floors = [
          { id: 'floor-0', name: 'floor 0', url: '/floor_plans/6_0.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-1', name: 'floor 1', url: '/floor_plans/6_1.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-1m', name: 'floor 1m', url: '/floor_plans/6_1M.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-2', name: 'floor 2', url: '/floor_plans/6_2.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-2m', name: 'floor 2m', url: '/floor_plans/6_2M.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-3', name: 'floor 3', url: '/floor_plans/6_3.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-4', name: 'floor 4', url: '/floor_plans/6_4.png', coordinates: placeholderCoordsB6 },
          { id: 'floor-5', name: 'floor 5', url: '/floor_plans/6_5.png', coordinates: placeholderCoordsB6 }
        ];
        processedData['building-6'] = {
            buildingIdentifier: '6',
            name: 'building 6 (temp)',
            floors: tempBuilding6Floors,
            bounds: getBounds(placeholderCoordsB6)
        };

        const placeholderCoordsB6C = [
          [-71.091051, 42.359809], // nw
          [-71.090723, 42.359920], // ne
          [ -71.090515, 42.359576], // se
          [-71.090853, 42.359464]  // sw
        ];
        const tempBuilding6CFloors = [
          { id: 'floor-0', name: 'floor 0', url: '/floor_plans/6C_0.png', coordinates: placeholderCoordsB6C },
          { id: 'floor-1', name: 'floor 1', url: '/floor_plans/6C_1.png', coordinates: placeholderCoordsB6C },
          { id: 'floor-2', name: 'floor 2', url: '/floor_plans/6C_2.png', coordinates: placeholderCoordsB6C },
          { id: 'floor-3', name: 'floor 3', url: '/floor_plans/6C_3.png', coordinates: placeholderCoordsB6C },
          { id: 'floor-4', name: 'floor 4', url: '/floor_plans/6C_4.png', coordinates: placeholderCoordsB6C },
          { id: 'floor-5', name: 'floor 5', url: '/floor_plans/6C_5.png', coordinates: placeholderCoordsB6C }
        ];
        processedData['building-6C'] = {
            buildingIdentifier: '6C',
            name: 'building 6C (temp)',
            floors: tempBuilding6CFloors,
            bounds: getBounds(placeholderCoordsB6C)
        };

        setBuildingsData(processedData);
        
        // default to the first available floor after data loads
        const firstBuildingKey = Object.keys(processedData)[0];
        const firstBuilding = processedData[firstBuildingKey];
        if (firstBuilding && firstBuilding.floors.length > 0) {
            // setActiveFloor(firstBuilding.floors[0].id);
            setActiveFloor('floor-1');
        } else {
             setActiveFloor('floor-0'); // fallback if no floors found
        }

      } catch (err) {
        console.error("failed to fetch building data:", err);
        setError("could not load map data. please try again later.");
        setBuildingsData({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchMapData();
  }, []);

  // provides a stable setter for floor id, updating both state and ref
  const setActiveFloor = (newFloorId) => {
    currentFloorIdRef.current = newFloorId;
    _setCurrentFloorId(newFloorId);
  };

  // ensures the ref always holds the latest floor id for use in callbacks
  useEffect(() => { currentFloorIdRef.current = currentFloorId; }, [currentFloorId]);

  // handles map layer visibility based on the currently selected floor
  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded() || !buildingsData || isLoading || !currentFloorId) return;
    const map = mapRef.current;

    Object.keys(buildingsData).forEach(buildingKey => {
        buildingsData[buildingKey].floors?.forEach(floor => {
            const layerId = `layer-${buildingKey}-${floor.id}`;
            if (map.getLayer(layerId)) {
                const visibility = (floor.id === currentFloorId) ? 'visible' : 'none';
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });
    });
    // todo: handle visibility of predefined room markers here too
  }, [currentFloorId, buildingsData, isLoading]);

  // handles map initialization and dynamic layer loading based on fetched data
  useEffect(() => {
    if (isLoading || !buildingsData) return;

    if (!mapRef.current) {
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/jieruei/cma66vw7o002v01sb57tg3qdo",
            center: [-71.0915, 42.3586],
            zoom: 16.5,
        });
        mapRef.current = map;
        window.mapboxMap = map;
        map.addControl(new mapboxgl.GeolocateControl({ /* options */ }));

        // map click handler - primarily for coordinate logging/copying currently
        const handleMapClick = (e) => {
            const { lng, lat } = e.lngLat;
            if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
            const activeFloorId = currentFloorIdRef.current;
            let clickedBuildingKey = null;

            if (buildingsData) { 
                 for (const bKey in buildingsData) {
                     if (isPointInBounds([lng, lat], buildingsData[bKey]?.bounds)) { 
                         clickedBuildingKey = bKey;
                         break;
                     }
                 }
             }

            const coordsString = `lng: ${lng.toFixed(6)}, lat: ${lat.toFixed(6)}`;
            console.log(`clicked coords: ${coordsString} (floor context: ${activeFloorId}, building context: ${clickedBuildingKey || 'outside'})`);
            
            // copy coordinates to clipboard if possible
            if (navigator.clipboard && window.isSecureContext) { 
                 navigator.clipboard.writeText(coordsString)
                  .then(() => { console.log("coordinates copied to clipboard."); })
                  .catch(err => { console.error("failed to copy coordinates:", err); });
            }
            
            // add temporary marker for visual feedback
            const newMarker = new mapboxgl.Marker().setLngLat([lng, lat]).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(coordsString)).addTo(map);
            setTempMarkers((prev) => [...prev, { lng, lat, building: clickedBuildingKey, floor: activeFloorId, marker: newMarker }]);
            
             /* --- commented out floor selector logic ---
              if (clickedBuildingKey && buildingsData?.[clickedBuildingKey]?.floors) {
                 const buildingFloors = buildingsData[clickedBuildingKey].floors;
                 // todo: pass buildingFloors to FloorSelectorPopup
                 // showFloorSelectorPopup(e.lngLat, buildingFloors, setActiveFloor);
              }
             */
        };
        map.on("click", handleMapClick);

        // load map sources and layers after initial map load event
        map.on('load', () => {
            if (!buildingsData) return;

            Object.keys(buildingsData).forEach(buildingKey => {
                const building = buildingsData[buildingKey];
                building.floors?.forEach(floor => {
                    const sourceId = `source-${buildingKey}-${floor.id}`;
                    const layerId = `layer-${buildingKey}-${floor.id}`;
                    
                    if (!map.getSource(sourceId) && floor.coordinates && floor.url) {
                         map.addSource(sourceId, { 
                             type: 'image', 
                             url: floor.url,
                             coordinates: floor.coordinates
                         });
                    }
                    
                    if (map.getSource(sourceId) && !map.getLayer(layerId)) {
                         map.addLayer({
                             id: layerId,
                             type: 'raster',
                             source: sourceId,
                             paint: { 'raster-opacity': 0.9, 'raster-fade-duration': 0 },
                             layout: {
                                 visibility: (floor.id === currentFloorIdRef.current) ? 'visible' : 'none'
                             }
                         });
                     }
                });
            });
        });
    }

    // cleanup for temporary markers added in this effect's scope
    return () => { 
        tempMarkers.forEach(m => m.marker?.remove());
        // floor selector popup cleanup
        if (popupRef.current) { popupRef.current.remove(); } 
        // map instance cleanup is handled by the mount/unmount effect below
    }; 

  }, [isLoading, buildingsData]); 

   // ensures map instance is properly removed on component unmount
   useEffect(() => {  
     const map = mapRef.current;
     return () => {
         if (map) {
             // todo: need to store and remove the specific handleMapClick listener
             map.remove();
             mapRef.current = null; 
             window.mapboxMap = null;
         }
     };
   }, []);

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center">loading map data...</div>;
  }

  if (error) {
    return <div className="w-full h-full flex items-center justify-center text-red-600">error: {error}</div>;
  }
  
  return (
    <div className="relative w-full h-full">
      {/* inject css for popup styling */}
      <style>{`
        .floor-selector-popup .mapboxgl-popup-content {
          padding: 8px;
        }
        .floor-selector-popup .mapboxgl-popup-close-button {
          font-size: 1.1rem;
        }
      `}</style>
      {/* todo: need ui (e.g., in sidebar) to call setactivefloor */} 
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default Map;
