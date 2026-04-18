// UsersWithoutAccessCount.jsx
import React from "react";
import { API_KEY } from "../../../../../constant";
import CountDisplay from "../CountDisplayTemplate";

const UsersWithoutAccessCount = () => {
  return (
    <CountDisplay
      title="Users Without Access"
      apiEndpoint={`${API_KEY}/api/users/users/no-access`}
      countClass="text-red-600"
      titleClass="text-red-800"
    />
  );
};

export default UsersWithoutAccessCount;
