// CountDisplay.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const CountDisplayTemplate = ({
  title,
  apiEndpoint,
  withCredentials = true,
  transformData,
  titleClass = "",
  countClass = "",
}) => {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true);
        
        const config = withCredentials ? { withCredentials } : {};
        console.log(`🔍 Fetching from: ${apiEndpoint}`);
        console.log(`🔍 Config:`, config);
        
        const response = await axios.get(apiEndpoint, config);
        
        // If a transformData function is provided, use it to calculate the count.
        const result = transformData
          ? transformData(response.data)
          : response.data.count || response.data;
        
        // Ensure we have a number, not an object
        const finalCount = typeof result === 'object' && result !== null 
          ? (result.count || result.value || 0)
          : (typeof result === 'number' ? result : 0);
        
        setCount(finalCount);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error(`❌ Error fetching from ${apiEndpoint}:`, err.response?.data || err.message);
        console.error(`❌ Status:`, err.response?.status);
        console.error(`❌ Headers:`, err.response?.headers);
        
        // Handle authentication errors specifically
        if (err.response?.status === 401) {
          setError("Authentication required. Please log in again.");
          setRetryCount(prev => prev + 1);
        } else if (err.response?.status === 403) {
          setError("Access forbidden. Admin privileges required.");
          setRetryCount(prev => prev + 1);
        } else {
          setError(err.response?.data?.message || err.message);
          // Retry other errors after a delay
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000 * (retryCount + 1)); // Exponential backoff
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [apiEndpoint, withCredentials, transformData, title, retryCount]);

  if (loading) {
    return (
      <div className="flex h-40 w-58 flex-col justify-center rounded-xl bg-white p-10 text-slate-900 shadow-lg">
        <div className="text-sm text-gray-500">Loading {title.toLowerCase()}...</div>
        <h2 className={`font-semibold ${titleClass || 'text-slate-900'}`}>{title}</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 w-58 flex-col justify-center rounded-xl bg-white p-10 text-slate-900 shadow-lg">
        <div className="text-red-600 text-sm">
          {error}
          {retryCount > 0 && retryCount <= 3 && (
            <div className="text-xs text-gray-500 mt-1">
              Retrying... ({retryCount}/3)
            </div>
          )}
        </div>
        <h2 className={`font-semibold ${titleClass || 'text-slate-900'}`}>{title}</h2>
      </div>
    );
  }
  
  if (count === null) {
    return (
      <div className="flex h-40 w-58 flex-col justify-center rounded-xl bg-white p-10 text-slate-900 shadow-lg">
        <div className="text-sm text-gray-500">No data available</div>
        <h2 className={`font-semibold ${titleClass || 'text-slate-900'}`}>{title}</h2>
      </div>
    );
  }

  return (
    <div className="flex h-40 w-58 flex-col justify-center rounded-xl bg-white p-10 text-slate-900 shadow-lg">
      <div
        className={`text-[50px] font-bold ${countClass || 'text-slate-900'}`}
      >
        {typeof count === 'number' ? count : '0'}
      </div>
      <h2 className={`font-semibold ${titleClass || 'text-slate-900'}`}>{title}</h2>
    </div>
  );
};

export default CountDisplayTemplate;
