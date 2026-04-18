// TotalUsersCount.jsx
import React from "react";
import { API_KEY } from "../../../../../constant";
import CountDisplay from "../CountDisplayTemplate";

const TotalUsersCount = () => {
  return (
    <CountDisplay
      title="Total Users"
      apiEndpoint={`${API_KEY}/api/users/users/count`}
    />
  );
};

export default TotalUsersCount;
