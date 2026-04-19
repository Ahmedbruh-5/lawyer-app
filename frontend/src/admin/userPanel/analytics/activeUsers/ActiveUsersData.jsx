// ActiveUsersData.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ActiveUsersChart from "./ActiveUsersChart";
import { API_KEY } from "../../../../constant";

const ActiveUsersData = () => {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30); // Default to 30 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define dropdown options
  const options = [
    { label: "1 Day", value: 1 },
    { label: "1 Week", value: 7 },
    { label: "1 Month", value: 30 },
    { label: "1 Year", value: 365 },
    { label: "From Start", value: 0 },
  ];

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        // If days is 0, treat it as "from start" by omitting the query parameter
        const url =
          days === 0
            ? `${API_KEY}/api/users/active-users`
            : `${API_KEY}/api/users/active-users?days=${days}`;
        const response = await axios.get(url, { withCredentials: true });
        // Expecting data in the format: [{ _id: 'YYYY-MM-DD', count: number }, ...]
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchActiveUsers();
  }, [days]);

  const handleChange = (e) => {
    setLoading(true);
    setDays(Number(e.target.value));
  };

  if (loading) return <div>Loading active users data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="h-90 w-150 rounded-xl bg-white p-10 text-slate-900">
      {/* <h2>
        Active Users in the Last {days === 0 ? "All Time" : `${days} Days`}
      </h2> */}
      <ActiveUsersChart data={data} />
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

export default ActiveUsersData;
