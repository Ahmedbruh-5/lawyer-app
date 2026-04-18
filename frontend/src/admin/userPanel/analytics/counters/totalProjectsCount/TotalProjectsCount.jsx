// TotalProjectsCount.jsx
import React from "react";
import { API_KEY } from "../../../../../constant";
import CountDisplay from "../CountDisplayTemplate";

const TotalProjectsCount = () => {
  return (
    <CountDisplay
      title="Total Projects"
      apiEndpoint={`${API_KEY}/api/projects/count`}
    />
  );
};

export default TotalProjectsCount;
