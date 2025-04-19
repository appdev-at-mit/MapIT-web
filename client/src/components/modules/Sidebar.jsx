import React, { useState } from "react";
import ActionBar from "./ActionBar";
import Logo from "../../assets/MIT_logo.png";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [selectedPage, setSelectedPage] = useState("home");

  const handlePageChange = (page) => {
    setSelectedPage(page);
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
        return <p className="text-sm">Food</p>;
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