import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiaGFpbGV5cGFuIiwiYSI6ImNtMmk1aTAzdTBqaXgya3EzczBuOTU0b3QifQ.Vfmnzm0EW8Z-3Dp3PhE8Aw";

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-71.092699, 42.357830],
      zoom: 15,
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

      // Create a new marker and add it to the map
      const newMarker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setText(
            `Marker at Longitude: ${lng}, Latitude: ${lat}`
          )
        ) // Optional popup
        .addTo(mapRef.current);

      // Add the new marker to the state
      setMarkers((prevMarkers) => [...prevMarkers, { lng, lat, marker: newMarker }]);
    };

    mapRef.current.on("click", handleMapClick);

    // add image overlay when map loads
    mapRef.current.on('load', () => {
      const imageUrl = '/floor_plans/1_0.png'; 
      
      const coordinates = [
        [-71.09280847435501, 42.35834378834414], // Top-left corner
        [-71.0921528451442, 42.358555201973275], // Top-right corner
        [-71.09166243795372, 42.35795523299731], // Bottom-right corner
        [-71.0924304232804, 42.35770468531794]  // Bottom-left corner
      ];

      mapRef.current.addSource('floorplan-1-source', {
          type: 'image',
          url: imageUrl,
          coordinates: coordinates
      });

      mapRef.current.addLayer({
          id: 'floorplan-1-layer',
          type: 'raster',
          source: 'floorplan-1-source',
          paint: {
              'raster-opacity': 0.85
          }
      });
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return (
    <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
  );
};

export default Map;
