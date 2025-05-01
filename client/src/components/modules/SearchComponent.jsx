import React, { useState, useCallback } from "react";
import { get } from "../../utilities";

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const SearchComponent = ({ onSearchResultSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // Can be null, [], or [roomData]
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        // Basic validation
        setResults(null);
        setError("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setResults(null);

      try {
        const roomData = await get(`/api/rooms/search/${encodeURIComponent(searchQuery)}`);
        setResults([roomData]);
        setError("");
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
        if (err.status === 404) {
          setError(`Room "${searchQuery}" not found.`);
        } else {
          setError("Search failed. Please try again.");
        }
      }
      setIsLoading(false);
    }, 300),
    []
  );

  const handleInputChange = (event) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleResultClick = (result) => {
    // Call the callback provided by Sidebar
    onSearchResultSelect(result);
    // Optionally clear search after selection
    // setQuery('');
    // setResults(null);
    // setError('');
  };

  return (
    <div className="p-2 space-y-3">
      <input
        type="text"
        placeholder="Search room (e.g., 1-136)"
        value={query}
        onChange={handleInputChange}
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {results && results.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <p className="text-xs text-gray-600 mb-1">Result:</p>
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleResultClick(result)}
              className="block w-full text-left p-2 rounded hover:bg-gray-200 text-sm"
            >
              {result.buildingName ? `${result.buildingName} - ` : ""}
              {result.roomNumber} ({result.floorName})
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
