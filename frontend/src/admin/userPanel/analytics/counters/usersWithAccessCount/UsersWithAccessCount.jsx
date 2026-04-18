// UsersWithAccessCount.jsx
import React from "react";
import { API_KEY } from "../../../../../constant";
import CountDisplay from "../CountDisplayTemplate";

const UsersWithAccessCount = () => {
  return (
    <CountDisplay
      title="Users With Access"
      apiEndpoint={`${API_KEY}/api/users/users/access`}
      countClass="text-green-600"
      titleClass="text-green-800"
    />
  );
};

export default UsersWithAccessCount;
