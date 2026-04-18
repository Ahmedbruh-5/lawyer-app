// ActiveUsersCount.jsx
import React from "react";
import { API_KEY } from "../../../../../constant";
import CountDisplay from "../CountDisplayTemplate";

const ActiveUsersCount = () => {
  const transformData = (data) =>
    data.reduce((sum, item) => sum + item.count, 0);

  return (
    <CountDisplay
      title="Active Users Today"
      apiEndpoint={`${API_KEY}/api/users/active-users?days=1`}
      transformData={transformData}
    />
  );
};

export default ActiveUsersCount;
