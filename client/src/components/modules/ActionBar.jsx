import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBookmark,
  faPlus,
  faUtensils,
  faBook,
  faBookOpen,
  faUser,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const ActionBar = ({ toggleSidebar, isOpen, onPageChange }) => {
  return (
    <div className="flex flex-col items-center space-y-6 bg-appdev-blue p-2 rounded-lg shadow-md shadow-appdev-blue">
      <FontAwesomeIcon
        icon={faUser}
        className="w-6 h-6 text-white cursor-pointer"
        onClick={() => onPageChange("profile")}
      />
      <FontAwesomeIcon
        icon={faSearch}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("search")}
      />
      <FontAwesomeIcon
        icon={faBookmark}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("bookmarks")}
      />
      <FontAwesomeIcon
        icon={faPlus}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("add")}
      />
      <FontAwesomeIcon
        icon={faUtensils}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("dining")}
      />
      <FontAwesomeIcon
        icon={faBookOpen}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("study")}
      />
      <FontAwesomeIcon
        icon={faBook}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("classes")}
      />
      <FontAwesomeIcon
        icon={faInfoCircle}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={() => onPageChange("about")}
      />
      <div className="w-full border-t border-gray-300 my-4"></div>

      <FontAwesomeIcon
        icon={isOpen ? faChevronLeft : faChevronRight}
        className="w-6 h-6 text-gray-100 cursor-pointer"
        onClick={toggleSidebar}
      />
    </div>
  );
};

export default ActionBar;