import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_KEY } from "../constant";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import Analytics from "./userPanel/analytics/Analytics";
import UserPanel from "./userPanel/UserPanel";
import LawyerPanel from "./lawyers/LawyerPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("home");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const response = await axios.get(`${API_KEY}/api/users/verifyAdmin`, {
          withCredentials: true,
        });
        setIsAdmin(Boolean(response.data?.isAdmin));
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  if (loading) {
    return (
      <div className="admin-root p-8 text-slate-900">Loading dashboard...</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-root p-8 text-slate-900">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="text-gray-600 mt-2">Only admins can access the dashboard.</p>
      </div>
    );
  }

  const renderContent = () => {
    if (activePage === "user-panel") return <UserPanel />;
    if (activePage === "lawyer-panel") return <LawyerPanel />;
    return <Analytics />;
  };

  return (
    <div className="admin-root flex min-h-screen flex-col bg-slate-200 text-slate-900 antialiased">
      <Header />
      <div className="flex">
        <Sidebar setActivePage={setActivePage} activePage={activePage} />
        <main className="flex-grow ml-64 mt-14">
          <button
            onClick={() => navigate("/home")}
            className="m-4 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Back to Home
          </button>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;