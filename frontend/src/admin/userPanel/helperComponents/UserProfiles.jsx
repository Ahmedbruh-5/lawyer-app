// UserStats.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
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
    pages: 0
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
        sortOrder: sortOrder
      });

      // console.log("Fetching users for stats from:", `${API_KEY}/api/user-stats/users?${params}`);
      const response = await axios.get(`${API_KEY}/api/user-stats/users?${params}`, {
        withCredentials: true,
      });
      // console.log("Users stats response:", response.data);
      setUsers(response.data.users || response.data);
      if (response.data.pagination) {
        setPaginationData(response.data.pagination);
      }
      setLoading(false);
    } catch (err) {
      // console.error("Error fetching users for stats:", err);
      setError(err.message);
      setLoading(false);

      // Show error notification
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Users',
        text: err.response?.data?.message || err.message,
        confirmButtonText: 'Try Again',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
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

  // 4. Get real-time statistics
  const fetchStats = async () => {
    try {
      console.log("🔍 Fetching real-time stats from backend...");
      const response = await axios.get(`${API_KEY}/api/user-stats/real-time-stats`, {
        withCredentials: true,
      });
      console.log("✅ Backend real-time stats response:", response.data);
      return response.data.stats;
    } catch (err) {
      console.error("❌ Error fetching real-time stats:", err.response?.data || err.message);
      return null;
    }
  };

  // State for real-time stats
  const [realTimeStats, setRealTimeStats] = useState({});

  // Fetch real-time stats
  useEffect(() => {
    const loadRealTimeStats = async () => {
      const stats = await fetchStats();
      if (stats) {
        setRealTimeStats(stats);
      }
    };
    loadRealTimeStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate statistics (fallback to client-side calculation if real-time stats not available)
  const stats = useMemo(() => {
    // console.log("🔍 Calculating stats...");
    // console.log("🔍 Real-time stats:", realTimeStats);
    // console.log("🔍 Users array:", users);

    // Try to use real-time stats from backend first
    if (Object.keys(realTimeStats).length > 0 && realTimeStats.totalUsers > 0) {
      console.log("✅ Using real-time stats from backend:", JSON.stringify(realTimeStats, null, 2));
      return realTimeStats;
    }

    // Fallback to client-side calculation
    if (!users.length) {
      // console.log("❌ No users available for calculation");
      return {
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        earlyaccessUsers: 0,
        beginnerUsers: 0,
        proUsers: 0,
        advancedUsers: 0,
        recentActiveUsers: 0,
        verificationRate: '0.0',
        beginnerRate: '0.0',
        proRate: '0.0',
        advancedRate: '0.0',
        activeRate: '0.0'
      };
    }

    // console.log("🔄 Using client-side calculation");
    const totalUsers = users.length;
    const verifiedUsers = users.filter(user => user.status === "Verified").length;
    const unverifiedUsers = users.filter(user => user.status === "Unverified").length;
    const earlyaccessUsers = users.filter(user => user.accessLevel === "Early Access").length;
    const beginnerUsers = users.filter(user => user.accessLevel === "Beginner").length;
    const proUsers = users.filter(user => user.accessLevel === "Pro").length;
    const advancedUsers = users.filter(user => user.accessLevel === "Advanced").length;

    // Debug: Log what we found
    // console.log("📊 User counts:", {
    //   totalUsers,
    //   verifiedUsers,
    //   unverifiedUsers,
    //   earlyaccessUsers,
    //   beginnerUsers,
    //   proUsers,
    //   advancedUsers
    // });

    // Debug: Log all user access levels
    // console.log("🔍 All user access levels:", users.map(user => ({ name: user.name, accessLevel: user.accessLevel })));

    // Get recent activity (users who logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActiveUsers = users.filter(user => {
      if (!user.lastLogin) return false;
      return new Date(user.lastLogin) > sevenDaysAgo;
    }).length;

    const calculatedStats = {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      earlyaccessUsers,
      beginnerUsers,
      proUsers,
      advancedUsers,
      recentActiveUsers,
      verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : '0.0',
      beginnerRate: totalUsers > 0 ? ((beginnerUsers / totalUsers) * 100).toFixed(1) : '0.0',
      proRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0.0',
      advancedRate: totalUsers > 0 ? ((advancedUsers / totalUsers) * 100).toFixed(1) : '0.0',
      activeRate: totalUsers > 0 ? ((recentActiveUsers / totalUsers) * 100).toFixed(1) : '0.0'
    };

    // console.log("📈 Calculated stats:", calculatedStats);
    return calculatedStats;
  }, [users, realTimeStats]);

  // Filtering (now handled by backend)
  const filteredUsers = useMemo(() => {
    return users;
  }, [users]);

  // Sorting (now handled by backend)
  const sortedUsers = useMemo(() => {
    return filteredUsers;
  }, [filteredUsers]);

  const currentUsers = useMemo(() => {
    return sortedUsers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedUsers, page, rowsPerPage]);

  // Checkbox handling - MOVED AFTER currentUsers definition
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
      // Show loading notification
      Swal.fire({
        title: 'Updating User Role...',
        text: `Setting user to ${newRole}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await axios.put(
        `${API_KEY}/api/user-stats/users/${userId}/access-level`,
        { accessLevel: newRole },
        { withCredentials: true }
      );

      // Show success notification
      Swal.fire({
        icon: 'success',
        title: 'Role Updated!',
        text: `User role has been updated to ${newRole}`,
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      // console.error("Error updating user role:", error);

      // Show error notification
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update user role',
        confirmButtonText: 'OK'
      });
    }
  };

  // 3. Bulk role update
  const handleBulkRoleUpdate = async (newRole) => {
    if (selectedUsers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Users Selected',
        text: 'Please select at least one user to update.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Update Multiple Users?',
        text: `Are you sure you want to set ${selectedUsers.length} user(s) to ${newRole}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update them!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Show loading notification
        Swal.fire({
          title: 'Updating Users...',
          text: `Setting ${selectedUsers.length} users to ${newRole}`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await axios.put(
          `${API_KEY}/api/user-stats/bulk-update-access-levels`,
          { userIds: selectedUsers, accessLevel: newRole },
          { withCredentials: true }
        );

        setSelectedUsers([]);

        // Show success notification
        Swal.fire({
          icon: 'success',
          title: 'Users Updated!',
          text: `Successfully updated ${selectedUsers.length} user(s) to ${newRole}`,
          timer: 2000,
          showConfirmButton: false
        });

        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      // console.error("Error updating user roles:", error);

      // Show error notification
      Swal.fire({
        icon: 'error',
        title: 'Bulk Update Failed',
        text: error.response?.data?.message || 'Failed to update user roles',
        confirmButtonText: 'OK'
      });
    }
  };

  if (loading) return <div style={{ padding: '20px' }}><Typography>Loading user statistics...</Typography></div>;
  if (error) return <div style={{ padding: '20px' }}><Typography color="error">Error: {error}</Typography></div>;

  return (
    <Box sx={{
      backgroundColor: '#ffffff',
      borderRadius: '1px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      margin: '1rem',
      padding: '3rem',
      minHeight: 'calc(100vh - 2rem)'
    }}>
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            marginTop: '1rem',
            padding: '0 0.5rem'
          }}>
            <Typography variant="h5">User Role Management</Typography>
            <Button
              variant="contained"
              onClick={async () => {
                Swal.fire({
                  title: 'Refreshing Data...',
                  text: 'Please wait while we fetch the latest data',
                  allowOutsideClick: false,
                  didOpen: () => {
                    Swal.showLoading();
                  }
                });
                await fetchUsers();
                Swal.fire({
                  icon: 'success',
                  title: 'Data Refreshed',
                  timer: 1500,
                  showConfirmButton: false
                });
              }}
              sx={{ bgcolor: 'primary.main' }}
            >
              Refresh Data
            </Button>
          </Box>
        </Grid>

        {/* Statistics Cards */}
        <Grid item>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{stats.totalUsers}</Typography>
                <Typography variant="body2">Total Users</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{stats.earlyaccessUsers}</Typography>
                <Typography variant="body2">Early Access ({stats.earlyaccessRate || '0.0'}%)</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{stats.beginnerUsers}</Typography>
                <Typography variant="body2">Beginner ({stats.beginnerRate}%)</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'info.light', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{stats.proUsers}</Typography>
                <Typography variant="body2">Pro ({stats.proRate}%)</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{stats.advancedUsers}</Typography>
                <Typography variant="body2">Advanced ({stats.advancedRate}%)</Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
              <Typography variant="body2">
                {selectedUsers.length} user(s) selected
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Early Access")}
                sx={{ bgcolor: 'success.main' }}
              >
                Set as Early Access
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Beginner")}
                sx={{ bgcolor: 'success.main' }}
              >
                Set as Beginner
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Pro")}
                sx={{ bgcolor: 'info.main' }}
              >
                Set as Pro
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleBulkRoleUpdate("Advanced")}
                sx={{ bgcolor: 'warning.main' }}
              >
                Set as Advanced
              </Button>
            </Box>
          </Grid>
        )}

        {/* Filters */}
        <Grid item>
          <Grid container spacing={2}>
            <Grid item>
              <TextField
                label="Search Users"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: 200 }}
              />
            </Grid>
            <Grid item>
              <TextField
                select
                label="Filter by Role"
                variant="outlined"
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="Early Access">Early Access</MenuItem>
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Pro">Pro</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Grid>

        {/* Sort Options */}
        <Grid item container spacing={2}>
          <Grid item>
            <TextField
              select
              label="Sort By"
              variant="outlined"
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="lastLogin">Last Login</MenuItem>
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="loginCount">Login Count</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="role">Role</MenuItem>
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Sort Order"
              variant="outlined"
              size="small"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Users Table */}
        <Grid item>
          <TableContainer sx={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white'
          }}>
            <Table size="small">
              <TableHead sx={{
                '& th': {
                  padding: '0.75rem',
                  fontSize: '0.813rem',
                  color: 'rgb(255, 255, 255)',
                  backgroundColor: '#3381ff',
                  fontWeight: 600,
                  borderRight: '1px solid rgba(0, 0, 0, 0.2)'
                },
                '& th:last-child': {
                  borderRight: 'none'
                }
              }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < currentUsers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Current Role</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Update Role</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Last Login</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Created</th>
                </tr>
              </TableHead>
              <TableBody>
                {currentUsers.map((user, index) => (
                  <tr key={user._id} style={{
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: index % 2 === 0 ? '#e9e9e9' : '#dddddd'
                  }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleCheckboxChange(user._id)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div>
                        <Typography variant="body2" fontWeight="bold">{user.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Chip
                        label={user.accessLevel || "No Role"}
                        size="small"
                        sx={{
                          bgcolor: user.accessLevel === "Early Access" ? "success.light" :
                            user.accessLevel === "Beginner" ? "success.light" :
                              user.accessLevel === "Pro" ? "info.light" :
                                user.accessLevel === "Advanced" ? "warning.light" : "grey.light",
                          color: "white",
                          fontWeight: 600
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', minWidth: 160 }}>
                      <TextField
                        select
                        size="small"
                        value={user.accessLevel || ""}
                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                        variant="outlined"
                        sx={{ minWidth: 140 }}
                      >
                        {/* <MenuItem value="">No Role</MenuItem> */}
                        <MenuItem value="Early Access">Early Access</MenuItem>
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Pro">Pro</MenuItem>
                        {/* <MenuItem value="Advanced">Advanced</MenuItem> */}
                      </TextField>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
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