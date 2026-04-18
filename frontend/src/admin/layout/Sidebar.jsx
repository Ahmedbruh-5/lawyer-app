import React, { useState } from "react";

const Sidebar = ({ setActivePage, activePage }) => {
  const [userOpen, setUserOpen] = useState(false);

  return (
    <div
      className="fixed flex flex-col top-14 left-0 w-14 hover:w-64 md:w-64 bg-blue-900 h-full text-white transition-all duration-300 border-none sidebar"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <div className="overflow-y-auto overflow-x-hidden flex flex-col flex-grow scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
        <ul className="flex flex-col py-2 space-y-0">
          {/* Header */}
          <li className="px-5 hidden md:block">
            <div className="flex flex-row items-center h-7">
              <div className="text-xs font-light tracking-wide text-white uppercase opacity-60">
                PYSIMVERSE
              </div>
            </div>
          </li>

          {/* Dashboard */}
          <SidebarItem
            onClick={() => setActivePage("home")}
            text="Dashboard"
            active={activePage === "home"}
          />

          {/* ── User Folder ── */}
          <FolderItem label="User" isOpen={userOpen} toggle={() => setUserOpen((v) => !v)} />
          {userOpen && (
            <ul className="hidden md:block">
              <SubItem
                onClick={() => setActivePage("user-panel")}
                text="User Panel"
                active={activePage === "user-panel"}
              />
              <SubItem
                onClick={() => setActivePage("lawyer-panel")}
                text="Lawyers"
                active={activePage === "lawyer-panel"}
              />
            </ul>
          )}
        </ul>
        
      </div>

      {/* Scroll hint fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(30,58,138,0.8))",
        }}
      />
    </div>
  );
};

const FolderItem = ({ label, isOpen, toggle }) => (
  <li>
    <button
      onClick={toggle}
      className="relative flex flex-row items-center h-10 w-full text-left pr-6 transition-colors duration-200 focus:outline-none focus:ring-0 hover:bg-blue-800 border-l-4 hover:border-blue-500"
      style={{
        backgroundColor: isOpen ? "rgba(255,255,255,0.07)" : "transparent",
        borderLeftColor: isOpen ? "#60a5fa" : "transparent",
      }}
    >
      <span className="ml-2 text-sm tracking-wide truncate text-white flex items-center gap-2 w-full">
        <span className="hidden md:inline">{label}</span>
        <span
          className="hidden md:inline ml-auto pr-1 text-xs text-white transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}
        >
          ➜
        </span>
      </span>
    </button>
  </li>
);

const SidebarItem = ({ onClick, text, active }) => (
  <li>
    <button
      onClick={onClick}
      className="relative flex flex-row items-center h-10 w-full text-left pr-6 transition-colors duration-200 focus:outline-none focus:ring-0 hover:bg-blue-800 border-l-4 hover:border-blue-500"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.07)" : "transparent",
        borderLeftColor: active ? "#60a5fa" : "transparent",
      }}
    >
      <span className="ml-2 text-sm tracking-wide truncate text-white">{text}</span>
    </button>
  </li>
);

const SubItem = ({ onClick, text, active }) => (
  <li>
    <button
      onClick={onClick}
      className="relative flex flex-row items-center h-9 w-full text-left transition-colors duration-200 focus:outline-none focus:ring-0 hover:bg-blue-800 border-l-4 hover:border-blue-400"
      style={{
        paddingLeft: "2.25rem",
        backgroundColor: active ? "rgba(96,165,250,0.12)" : "transparent",
        borderLeftColor: active ? "#93c5fd" : "transparent",
      }}
    >
      <span className="text-xs tracking-wide truncate" style={{ color: active ? "#93c5fd" : "#ffffff" }}>
        {text}
      </span>
    </button>
  </li>
);

export default Sidebar;