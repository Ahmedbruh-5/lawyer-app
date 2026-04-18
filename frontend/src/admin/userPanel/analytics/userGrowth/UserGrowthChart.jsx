// UserGrowthChart.jsx
import React from "react";

const UserGrowthChart = ({ data }) => {
  // Extract the labels (dates) and values from the data
  const labels = data.map((item) => item.date);
  const dailyData = data.map((item) => item.daily);
  const cumulativeData = data.map((item) => item.cumulative);

  const lastIndex = labels.length - 1;
  const latestDaily = lastIndex >= 0 ? dailyData[lastIndex] : 0;
  const latestCumulative = lastIndex >= 0 ? cumulativeData[lastIndex] : 0;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 text-base font-semibold">User Growth Overview</h3>
      <div className="mb-3 text-sm text-slate-600">
        Latest Daily: <span className="font-semibold text-slate-900">{latestDaily}</span> | Total:{" "}
        <span className="font-semibold text-slate-900">{latestCumulative}</span>
      </div>
      <div className="max-h-56 overflow-auto rounded border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Daily</th>
              <th className="px-3 py-2 text-left">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(-20).map((item) => (
              <tr key={item.date} className="border-t border-slate-100">
                <td className="px-3 py-2">{item.date}</td>
                <td className="px-3 py-2">{item.daily}</td>
                <td className="px-3 py-2">{item.cumulative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserGrowthChart;
