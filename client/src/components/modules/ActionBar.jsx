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
    <div className="flex flex-col items-center space-y-5 bg-gray-100 p-2 rounded-lg shadow-md">
      <FontAwesomeIcon
        icon={faUser}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("profile")}
      />
      <FontAwesomeIcon
        icon={faSearch}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("search")}
      />
      <FontAwesomeIcon
        icon={faBookmark}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("bookmarks")}
      />
      <FontAwesomeIcon
        icon={faPlus}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("add")}
      />
      <FontAwesomeIcon
        icon={faUtensils}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("dining")}
      />
      <FontAwesomeIcon
        icon={faBookOpen}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("study")}
      />
      <FontAwesomeIcon
        icon={faBook}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("classes")}
      />
      <FontAwesomeIcon
        icon={faInfoCircle}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={() => onPageChange("about")}
      />
      <div className="w-full border-t border-gray-300 my-4"></div>

      <FontAwesomeIcon
        icon={isOpen ? faChevronLeft : faChevronRight}
        className="w-8 h-8 text-gray-500 cursor-pointer"
        onClick={toggleSidebar}
      />
    </div>
  );
};

export default ActionBar;