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
    { name: "Simmons Dining Hall", coordinates: [-71.10152, 42.35712] },
    { name: "Maseeh Dining Hall", coordinates: [-71.09369, 42.35767] },
    { name: "McCormick Dining Hall", coordinates: [-71.09470, 42.35713] },
    { name: "Baker Dining Hall", coordinates: [-71.09557, 42.35686] },
    { name: "Next Dining Hall", coordinates: [-71.10212, 42.35469] },
    { name: "New Vassar Dining Hall", coordinates: [-71.09822, 42.35877] },
    { name: "Forbes Family Cafe", coordinates: [-71.08992, 42.36173] },
    { name: "Bleni", coordinates: [-71.09137, 42.35985] },
    { name: "Cava", coordinates: [-71.08777, 42.36319] },
    { name: "Vester", coordinates: [-71.08821, 42.36329] },
    { name: "Starbucks", coordinates: [-71.08567, 42.36302] },
    { name: "Flour Bakery + Cafe", coordinates: [-71.09669, 42.36103] },
    { name: "Saloniki", coordinates: [-71.09599, 42.36099] },
  ];

  const studySpots = [
    { name: "Stratton Student Center", coordinates: [-71.09476535644784, 42.35903326696096] },
    { name: "Hayden Library", coordinates: [-71.08937529538572, 42.35896647619004] },
    { name: "Stata Center", coordinates: [-71.09072556223546, 42.36173658007837] },
    { name: "Barker Engineering Library", coordinates: [-71.09203912932843, 42.35977356745832] },
    { name: "Dewey Library", coordinates: [-71.08373000634627, 42.36128553075362] },
    { name: "Lewis Music Library", coordinates: [-71.08899450929553, 42.35929377367246] },
    { name: "Rotch Library", coordinates: [-71.09321532180071, 42.35947949282156] },
    { name: "Green Building", coordinates: [-71.08931623843961, 42.36030738139383] },
    { name: "DUSP (Building 9)", coordinates: [-71.09373843274399, 42.35976734675243] },
    { name: "MIT.nano (Building 12)", coordinates: [-71.09153376123022, 42.36016203224441] },
    { name: "Brain and Cognitive Sciences (Building 46)", coordinates: [-71.09174171732207, 42.362015719981414] },
    { name: "Building 66", coordinates: [-71.08909392982532, 42.36088503920603] },
    { name: "iHQ (E38 Floor 3)", coordinates: [-71.08582332989639, 42.36214017769601] },
    { name: "STEAM (Building 7 Floor 4)", coordinates: [-71.09321701983852, 42.35931027407876] },
    { name: "Cheney Room (3-308)", coordinates: [-71.09246413230488, 42.3589617517468] },
    { name: "Banana Lounge", coordinates: [-71.09113521872786, 42.36063637099156] },
    { name: "Martin Trust Center (E40)", coordinates: [-71.08480396721305, 42.36109872321201] },
    { name: "Tang Center (E51)", coordinates: [-71.08442846882926, 42.36063347573548] },
  ];

  const [currentMarker, setCurrentMarker] = useState(null);

  const handleLocationClick = (coordinates) => {
    if (!window.mapboxMap) {
      console.error("Map not loaded yet");
      return;
    }

    if (currentMarker) {
      currentMarker.remove();
    }

    const [lng, lat] = coordinates;
  
    const newMarker = new mapboxgl.Marker({ color: "red" })
      .setLngLat(coordinates)
      .addTo(window.mapboxMap);
  
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
      case "study":
        return (
          <div className="flex flex-col space-y-2 text-sm">
            <p className="text-sm">Study Spots:</p>
            {studySpots.map((loc, idx) => (
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
      case "about":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About MapIT</h3>
            <p className="text-sm">
              MapIT is a comprehensive campus navigation tool designed to help you explore and discover MIT's campus with ease.
            </p>
            <div className="space-y-2">
              <h4 className="text-md font-medium">Features:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Interactive campus map</li>
                <li>Search for buildings and locations</li>
                <li>Find dining options</li>
                <li>Locate classrooms</li>
                <li>Save your favorite spots</li>
                <li>Add new locations</li>
              </ul>
            </div>
            <p className="text-sm mt-4">
              Built by AppDev @ MIT for MIT students, MapIT aims to make campus navigation intuitive and efficient.
            </p>
          </div>
        );
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