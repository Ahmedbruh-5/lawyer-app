// UserGrowthData.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import UserGrowthChart from "./UserGrowthChart";
import { API_KEY } from "../../../../constant";

const UserGrowthData = () => {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30); // Default to 30 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define dropdown options for time periods
  const options = [
    { label: "1 Day", value: 1 },
    { label: "1 Week", value: 7 },
    { label: "1 Month", value: 30 },
    { label: "1 Year", value: 365 },
    { label: "From Start", value: 0 },
  ];

  useEffect(() => {
    const fetchUserGrowth = async () => {
      try {
        // If days is 0, treat it as "from start" (omitting the days query parameter)
        const url =
          days === 0
            ? `${API_KEY}/api/users/user-growth`
            : `${API_KEY}/api/users/user-growth?days=${days}`;
        const response = await axios.get(url, { withCredentials: true });
        // Expected response format:
        // [{ date: "YYYY-MM-DD", daily: number, cumulative: number }, ...]
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchUserGrowth();
  }, [days]);

  const handleChange = (e) => {
    setLoading(true);
    setDays(Number(e.target.value));
  };

  if (loading) return <div>Loading user growth data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white w-150 h-90 rounded-xl p-10">
      <UserGrowthChart data={data} />

      <div className="pt-3">
        <label htmlFor="timePeriod">Select Time Period: </label>
        <select id="timePeriod" value={days} onChange={handleChange}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default UserGrowthData;
