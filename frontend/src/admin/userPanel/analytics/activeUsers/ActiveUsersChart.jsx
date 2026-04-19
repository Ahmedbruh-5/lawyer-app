// ActiveUsersChart.jsx
import React from "react";

const ActiveUsersChart = ({ data }) => {
  // Extract the dates (labels) and counts from the data array.
  const labels = data.map((item) => item._id);
  const counts = data.map((item) => item.count);

  const lastIndex = counts.length - 1;
  const latestCount = lastIndex >= 0 ? counts[lastIndex] : 0;

  return (
    <div className="rounded-lg border border-slate-200 p-4 text-slate-900">
      <h3 className="mb-3 text-base font-semibold text-slate-900">Active Users Overview</h3>
      <div className="mb-3 text-sm text-slate-600">
        Latest Active Users: <span className="font-semibold text-slate-900">{latestCount}</span>
      </div>
      <div className="max-h-56 overflow-auto rounded border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-slate-900">Date</th>
              <th className="px-3 py-2 text-left text-slate-900">Active Users</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(-20).map((item) => (
              <tr key={item._id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-800">{item._id}</td>
                <td className="px-3 py-2 text-slate-800">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveUsersChart;
