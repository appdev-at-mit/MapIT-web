import React, { useState } from "react";
import ActionBar from "./ActionBar";
import Logo from "../../assets/MIT_logo.png";
import mapboxgl from "mapbox-gl";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [selectedPage, setSelectedPage] = useState("home");

  const handlePageChange = (page) => {
    setSelectedPage(page);
  };

  const foodSpots = [
    { name: "Simmons Dining", coordinates: [-71.10152, 42.35712] },
    { name: "Forbes Family Cafe", coordinates: [-71.08992, 42.36173] },
    { name: "Bleni", coordinates: [-71.09137, 42.35985] },
  ];

  const [currentMarker, setCurrentMarker] = useState(null);

  const handleLocationClick = (coordinates) => {
    if (!window.mapboxMap) {
      console.error("Map not loaded yet");
      return;
    }

    if (currentMarker) {
      currentMarker.remove(); // Remove old marker
    }

    const [lng, lat] = coordinates;
  
    const newMarker = new mapboxgl.Marker({ color: "red" }) // Optional color
      .setLngLat(coordinates)
      .addTo(window.mapboxMap);

    console.log("✅ New marker created:", newMarker);
  
    setCurrentMarker(newMarker);

    window.mapboxMap.flyTo({
      center: coordinates,
      zoom: 16,
    });
  };

  const renderContent = () => {
    switch (selectedPage) {
      case "search":
        return <p className="text-sm">Search</p>;
      case "bookmarks":
        return <p className="text-sm">Saved locations</p>;
      case "add":
        return <p className="text-sm">Add new location</p>;
      case "dining":
        return (
          <div className="flex flex-col space-y-2 text-sm">
            <p className="text-sm">Dining Locations:</p>
            {foodSpots.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => handleLocationClick(loc.coordinates)}
                className="text-left px-2 py-1 rounded hover:bg-gray-200"
              >
                {loc.name}
              </button>
            ))}
          </div>
        );
      case "classes":
        return <p className="text-sm">Classes</p>;
      case "profile":
        return <p className="text-sm">Profile</p>;
      default:
        return <p className="text-sm">Welcome!</p>;
    }
  };

  return (
    <div
      className={`bg-white text-black transition-all duration-300 ease-in-out fixed top-0 left-0 h-full ${
        isOpen ? "w-64" : "w-14"
      } flex flex-col items-center shadow-lg`}
      style={{ zIndex: 10 }}
    >
      {isOpen && (
        <div className="p-4 space-y-4 w-full">
          <div className="flex flex-row space-x-4 border-b pb-4">
            <img src={Logo} className="h-8" alt="MIT Logo" />
            <h2 className="text-xl font-semibold">Campus Map</h2>
          </div>
          {renderContent()}
        </div>
      )}

      <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
        <ActionBar
          toggleSidebar={toggleSidebar}
          isOpen={isOpen}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Sidebar;