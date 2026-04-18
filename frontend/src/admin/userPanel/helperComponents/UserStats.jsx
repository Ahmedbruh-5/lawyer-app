// UserStats.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Table,
  TableHead,
  TableBody,
  TableContainer,
  TablePagination,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Checkbox,
  Button,
} from "@mui/material";
import { API_KEY } from "../../../../constant";

const UserStats = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("lastLogin");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [paginationData, setPaginationData] = useState({
    page: 0,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        search: search,
        roleFilter: roleFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await axios.get(
        `${API_KEY}/api/user-stats/users?${params}`,
        { withCredentials: true }
      );
      setUsers(response.data.users || response.data);
      if (response.data.pagination) {
        setPaginationData(response.data.pagination);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error Loading Users",
        text: err.response?.data?.message || err.message,
        confirmButtonText: "Try Again",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, roleFilter, sortBy, sortOrder]);

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Checkbox handling
  const handleCheckboxChange = (id) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((userId) => userId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((user) => user._id));
    }
  };

  // Role update handlers
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      Swal.fire({
        title: "Updating User Role...",
        text: `Setting user to ${newRole}`,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); },
      });

      await axios.put(
        `${API_KEY}/api/user-stats/users/${userId}/access-level`,
        { accessLevel: newRole },
        { withCredentials: true }
      );

      Swal.fire({
        icon: "success",
        title: "Role Updated!",
        text: `User role has been updated to ${newRole}`,
        timer: 1500,
        showConfirmButton: false,
      });

      fetchUsers();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.response?.data?.message || "Failed to update user role",
        confirmButtonText: "OK",
      });
    }
  };

  // Bulk role update
  const handleBulkRoleUpdate = async (newRole) => {
    if (selectedUsers.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Users Selected",
        text: "Please select at least one user to update.",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Update Multiple Users?",
        text: `Are you sure you want to set ${selectedUsers.length} user(s) to ${newRole}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, update them!",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Updating Users...",
          text: `Setting ${selectedUsers.length} users to ${newRole}`,
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); },
        });

        await axios.put(
          `${API_KEY}/api/user-stats/bulk-update-access-levels`,
          { userIds: selectedUsers, accessLevel: newRole },
          { withCredentials: true }
        );

        setSelectedUsers([]);

        Swal.fire({
          icon: "success",
          title: "Users Updated!",
          text: `Successfully updated ${selectedUsers.length} user(s) to ${newRole}`,
          timer: 2000,
          showConfirmButton: false,
        });

        fetchUsers();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Bulk Update Failed",
        text: error.response?.data?.message || "Failed to update user roles",
        confirmButtonText: "OK",
      });
    }
  };

  // Real-time stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API_KEY}/api/user-stats/real-time-stats`,
        { withCredentials: true }
      );
      return response.data.stats;
    } catch (err) {
      return null;
    }
  };

  const [realTimeStats, setRealTimeStats] = useState({});

  useEffect(() => {
    const loadRealTimeStats = async () => {
      const stats = await fetchStats();
      if (stats) setRealTimeStats(stats);
    };
    loadRealTimeStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (Object.keys(realTimeStats).length > 0 && realTimeStats.totalUsers > 0) {
      return realTimeStats;
    }

    if (!users.length) {
      return {
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        earlyaccessUsers: 0,
        proUsers: 0,
        recentActiveUsers: 0,
        verificationRate: "0.0",
        proRate: "0.0",
        activeRate: "0.0",
      };
    }

    const totalUsers = users.length;
    const verifiedUsers = users.filter((u) => u.status === "Verified").length;
    const unverifiedUsers = users.filter((u) => u.status === "Unverified").length;
    const earlyaccessUsers = users.filter((u) => u.accessLevel === "Free").length;
    const proUsers = users.filter((u) => u.accessLevel === "Pro").length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActiveUsers = users.filter((u) => u.lastLogin && new Date(u.lastLogin) > sevenDaysAgo).length;

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      earlyaccessUsers,
      proUsers,
      recentActiveUsers,
      verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : "0.0",
      proRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0.0",
      activeRate: totalUsers > 0 ? ((recentActiveUsers / totalUsers) * 100).toFixed(1) : "0.0",
    };
  }, [users, realTimeStats]);

  const filteredUsers = useMemo(() => users, [users]);
  const sortedUsers = useMemo(() => filteredUsers, [filteredUsers]);
  const currentUsers = useMemo(() => {
    return sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedUsers, page, rowsPerPage]);

  if (loading)
    return (
      <div style={{ padding: "20px" }}>
        <Typography>Loading user statistics...</Typography>
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "20px" }}>
        <Typography color="error">Error: {error}</Typography>
      </div>
    );

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: "1px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        margin: "1rem",
        padding: "3rem",
        minHeight: "calc(100vh - 2rem)",
      }}
    >
      <Grid container direction="column" spacing={2}>

        {/* Header — title only, no refresh button */}
        <Grid item>
          <Box sx={{ marginBottom: "1rem", marginTop: "1rem", padding: "0 0.5rem" }}>
            <Typography variant="h5">User Role Management</Typography>
          </Box>
        </Grid>

        {/* Statistics Cards — pushed down with extra top margin */}
        <Grid item sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: "info.light", color: "white", borderRadius: 2 }}>
                <Typography variant="h4">{stats.totalUsers}</Typography>
                <Typography variant="body2">Total Users</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: "success.light", color: "white", borderRadius: 2 }}>
                <Typography variant="h4">{stats.freeUsers}</Typography>
                <Typography variant="body2">Free ({stats.proRate}%)</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: "warning.light", color: "white", borderRadius: 2 }}>
                <Typography variant="h4">{stats.proUsers}</Typography>
                <Typography variant="body2">Pro ({stats.proRate}%)</Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Grid item>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">
                {selectedUsers.length} user(s) selected
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Free")}
                sx={{ bgcolor: "success.main" }}
              >
                Set as Free
              </Button>
              {/* <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Beginner")}
                sx={{ bgcolor: "success.main" }}
              >
                Set as Beginner
              </Button> */}
              <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Pro")}
                sx={{ bgcolor: "info.main" }}
              >
                Set as Pro
              </Button>
            </Box>
          </Grid>
        )}

        {/* Filters + Sort — all aligned to the right */}
        <Grid item>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <TextField
              label="Search Users"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              select
              label="Filter by Role"
              variant="outlined"
              size="small"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Tiers</MenuItem>
              <MenuItem value="Free">Free</MenuItem>
              {/* <MenuItem value="Beginner">Beginner</MenuItem> */}
              <MenuItem value="Pro">Pro</MenuItem>
            </TextField>
            <TextField
              select
              label="Sort By"
              variant="outlined"
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="lastLogin">Last Login</MenuItem>
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="loginCount">Login Count</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="role">Tiers</MenuItem>
            </TextField>
            <TextField
              select
              label="Sort Order"
              variant="outlined"
              size="small"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </TextField>
          </Box>
        </Grid>

        {/* Users Table */}
        <Grid item>
          <TableContainer
            sx={{
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
            }}
          >
            <Table size="small">
              <TableHead
                sx={{
                  "& th": {
                    padding: "0.75rem",
                    fontSize: "0.813rem",
                    color: "rgb(255, 255, 255)",
                    backgroundColor: "#3381ff",
                    fontWeight: 600,
                    borderRight: "1px solid rgba(0, 0, 0, 0.2)",
                  },
                  "& th:last-child": { borderRight: "none" },
                }}
              >
                <tr>
                  <th style={{ padding: "12px", textAlign: "center" }}>
                    <Checkbox
                      checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < currentUsers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>User</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Current Tier</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Update Tier</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Last Login</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Created</th>
                </tr>
              </TableHead>
              <TableBody>
                {currentUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    style={{
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: index % 2 === 0 ? "#e9e9e9" : "#dddddd",
                    }}
                  >
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleCheckboxChange(user._id)}
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div>
                        <Typography variant="body2" fontWeight="bold">{user.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                      </div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <Chip
                        label={user.accessLevel || "No Role"}
                        size="small"
                        sx={{
                          bgcolor:
                            user.accessLevel === "Free" ? "success.light"
                            // : user.accessLevel === "Beginner" ? "success.light"
                            : user.accessLevel === "Pro" ? "info.light"
                            : "grey.500",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", minWidth: 160 }}>
                      <TextField
                        select
                        size="small"
                        value={user.accessLevel || ""}
                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                        variant="outlined"
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="Free">Free</MenuItem>
                        {/* <MenuItem value="Beginner">Beginner</MenuItem> */}
                        <MenuItem value="Pro">Pro</MenuItem>
                      </TextField>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <Typography variant="body2">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <Typography variant="body2">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={paginationData.total || filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserStats;