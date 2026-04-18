// TotalDownloadsCount.jsx
import React from "react";

const TotalDownloadsCount = () => {
  return (
    <div className="flex flex-col justify-center bg-white p-10 w-58 h-40 rounded-xl shadow-lg">
      <div className="text-[50px] font-bold text-slate-700">0</div>
      <h2 className="text-slate-700">Total Downloads</h2>
      <p className="text-xs text-slate-500 mt-1">Downloads API not connected yet</p>
    </div>
  );
};

export default TotalDownloadsCount;
