// Analytics.jsx
import React, { useState, useEffect } from "react";
import TotalUsersCount from "./counters/totalUsers/totalUsersCount";
import ActiveUsersData from "./activeUsers/ActiveUsersData";
import UserGrowthData from "./userGrowth/UserGrowthData";
import ActiveUsersCount from "./counters/activeUsersCount/ActiveUsersCount";
import UsersWithAccessCount from "./counters/usersWithAccessCount/UsersWithAccessCount";
import UsersWithoutAccessCount from "./counters/usersWithoutAccessCount/UsersWithoutAccessCount";
// import TotalDownloadsCount from "./counters/totalDownloads/TotalDownloadsCount";

const Analytics = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Error boundary for counter components
  const renderCounter = (CounterComponent, name) => {
    try {
      return <CounterComponent />;
    } catch (err) {
      return (
        <div className="flex flex-col justify-center bg-white p-10 w-58 h-40 rounded-xl shadow-lg">
          <div className="text-red-600 text-sm">Error loading {name}</div>
          <h2 className="text-lg font-semibold">{name}</h2>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="flex flex-col bg-gray-200 p-10 text-slate-900">
        <h1 className="mb-10 text-[2em] font-semibold text-slate-900">
          AdvokateDesk Dashboard
        </h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-200 p-10 text-slate-900">
      <h1 className="mb-10 text-[2em] font-semibold text-slate-900">
        AdvokateDesk Dashboard
      </h1>
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard content...</p>
        </div>
      ) : (
        <>
          <section className="mb-10 flex gap-3">
            {renderCounter(TotalUsersCount, "Total Users")}
            {renderCounter(ActiveUsersCount, "Active Users")}
            {renderCounter(UsersWithAccessCount, "Users With Access")}
            {renderCounter(UsersWithoutAccessCount, "Users Without Access")}
            {/* {renderCounter(TotalDownloadsCount, "Total Download Counts")} */}

            {/* <TotalProjectsCount/> */}
          </section>
          <section className="bg-gray-200 flex gap-3">
            <UserGrowthData />
            <ActiveUsersData />
          </section>
          <section></section>
        </>
      )}
    </div>
  );
};

export default Analytics;
