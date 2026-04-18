import React from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed w-full flex items-center justify-between h-14 z-10 bg-blue-800 text-white px-4">
      {/* Logo */}
      <div className="flex items-center w-14 md:w-64 h-14">
        <div className="hidden md:flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-blue-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
          </svg>
          <span className="font-bold text-lg">AdvokateDesk</span>
        </div>
      </div>

      {/* Search + LMS Admin button */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* LMS Admin button — left of search, blue outline style for visibility on blue bg */}

        {/* Search */}
        <div className="relative flex items-center bg-white rounded-lg w-full shadow-sm border border-gray-200">
          <svg
            className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 bg-transparent outline-none rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
