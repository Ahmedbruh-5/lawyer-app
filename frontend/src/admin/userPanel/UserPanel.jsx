// UserPanel.jsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
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
  Button,
  Checkbox,
  TextField,
  MenuItem,
} from "@mui/material";
import { API_KEY } from "../../../constant";
import "./userPanel.css";
import UserFilters from "./helperComponents/UserFilters";
import UserTableHeader from "./helperComponents/UserTableHeader";
import UserTableRow from "./helperComponents/UserTableRow";
import EditUserDialog from "./helperComponents/EditUserDialog";
import AddUserDialog from "./helperComponents/AddUserDialog";

const UserPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [accessLevelFilter, setAccessLevelFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // New states for sorting
  const [sortBy, setSortBy] = useState("lastLogin"); // "lastLogin" or "createdAt"
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  // State for the Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Fetching users from:", `${API_KEY}/api/users/users`);
        const response = await axios.get(`${API_KEY}/api/users/users`, {
          withCredentials: true,
        });
        console.log("Users response:", response.data);
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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

  // Open edit dialog
  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  // Close edit dialog
  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  // Open add dialog
  const handleAdd = () => {
    setAddDialogOpen(true);
  };

  // Close add dialog
  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  // Save changes from edit dialog
  const handleDialogSave = (updatedData) => {
    axios
      .put(`${API_KEY}/api/users/users/${selectedUser._id}`, updatedData, {
        withCredentials: true,
      })
      .then((response) => {
        // Update the user in the local state with the response data
        setUsers(
          users.map((u) => (u._id === selectedUser._id ? response.data : u))
        );
        setEditDialogOpen(false);
        Swal.fire("Updated!", "User information has been updated.", "success");
      })
      .catch((error) => {
        console.error("Error updating user:", error);

        // If it's a 500 error but the update might have succeeded, refresh the user data
        if (error.response?.status === 500) {
          // Refresh the user data from the server to get the latest state
          axios
            .get(`${API_KEY}/api/users/users`, { withCredentials: true })
            .then((refreshResponse) => {
              setUsers(refreshResponse.data);
              setEditDialogOpen(false);
              Swal.fire(
                "Updated!",
                "User information has been updated. (Refreshed from server)",
                "success"
              );
            })
            .catch((refreshError) => {
              console.error("Error refreshing users:", refreshError);
              Swal.fire(
                "Warning!",
                "User may have been updated, but could not refresh the data. Please refresh the page.",
                "warning"
              );
            });
        } else {
          // For other errors, show the standard error message
          Swal.fire("Error!", "Could not update user info.", "error");
        }
      });
  };

  // Deleting user
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm Delete!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_KEY}/api/users/users/${id}`, { withCredentials: true })
          .then(() => {
            setUsers(users.filter((user) => user._id !== id));
            Swal.fire("Deleted!", "User has been deleted.", "success");
          })
          .catch((error) => {
            console.error("Error deleting user:", error);
            Swal.fire("Error!", "Could not delete user.", "error");
          });
      }
    });
  };

  // Bulk edit
  const handleBulkEdit = useCallback(() => {
    if (selectedUsers.length === 0) {
      Swal.fire(
        "No Users Selected",
        "Please select at least one user.",
        "warning"
      );
      return;
    }
    Swal.fire({
      title: "Edit Selected Users",
      html: `
        <div style="text-align: left; margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Role:</label>
          <select id="role" class="swal2-input" style="width: 100%; margin-bottom: 15px;">
            <option value="">Select Role (or leave unchanged)</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>
        <div style="text-align: left; margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Status:</label>
          <select id="status" class="swal2-input" style="width: 100%; margin-bottom: 15px;">
            <option value="">Select Status (or leave unchanged)</option>
            <option value="Verified">Verified</option>
            <option value="Unverified">Unverified</option>
          </select>
        </div>
        <div style="text-align: left; margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Access:</label>
          <select id="access" class="swal2-input" style="width: 100%; margin-bottom: 15px;">
            <option value="">Select Access (or leave unchanged)</option>
            <option value="true">Grant Access</option>
            <option value="false">Revoke Access</option>
          </select>
        </div>
        <div style="text-align: left; margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Tier Access:</label>
          <select id="accesslevel" class="swal2-input" style="width: 100%; margin-bottom: 15px;">
            <option value="">Select Tier Access (or leave unchanged)</option>
            <option value="Free">Free Tier</option>
            <option value="Pro">Pro Tier</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        const role = document.getElementById("role").value;
        const status = document.getElementById("status").value;
        const accessValue = document.getElementById("access").value;
        // FIX: ID was "accessLevel" (camelCase) but HTML uses "accesslevel" (lowercase)
        const accessLevelValue = document.getElementById("accesslevel").value;
        return {
          role: role || null,
          status: status || null,
          access: accessValue !== "" ? accessValue === "true" : null,
          // Send raw string ("free" or "pro") to match what the backend expects
          accessLevel: accessLevelValue !== "" ? accessLevelValue : null,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { role, status, access, accessLevel } = result.value;
        const updates = {};
        if (role) updates.role = role;
        if (status) updates.status = status;
        if (access !== null) updates.access = access;
        if (accessLevel !== null) updates.accessLevel = accessLevel;
        if (Object.keys(updates).length === 0) {
          Swal.fire("No Changes", "No fields were updated.", "info");
          return;
        }
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            selectedUsers.includes(user._id) ? { ...user, ...updates } : user
          )
        );
        Swal.fire("Updated!", "Selected users have been updated.", "success");
      }
    });
  }, [selectedUsers, setUsers]);

  // Bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedUsers.length === 0) {
      Swal.fire(
        "No Users Selected",
        "Please select at least one user.",
        "warning"
      );
      return;
    }
    Swal.fire({
      title: "Delete Selected Users?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6B7280",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${API_KEY}/api/users/users/delete-multiple`,
            {
              data: { userIds: selectedUsers },
              withCredentials: true,
            }
          );

          if (response.data.deletedCount > 0) {
            // Update the local state by removing the deleted users
            setUsers((prevUsers) =>
              prevUsers.filter((user) => !selectedUsers.includes(user._id))
            );
            setSelectedUsers([]);
            Swal.fire(
              "Deleted!",
              "Selected users have been removed.",
              "success"
            );
          } else {
            Swal.fire("Error", "No users were deleted.", "error");
          }
        } catch (error) {
          Swal.fire(
            "Error",
            "Failed to delete users. Please try again.",
            "error"
          );
        }
      }
    });
  }, [selectedUsers, setUsers]);

  // handle bulk access
  const handleBulkAccess = useCallback(() => {
    if (selectedUsers.length === 0) {
      Swal.fire(
        "No Users Selected",
        "Please select at least one user.",
        "warning"
      );
      return;
    }

    Swal.fire({
      title: "Update Access for Selected Users",
      html: `
      <select id="access" class="swal2-select">
          <option value="true">True</option>
          <option value="false">False</option>
      </select>
    `,
      showCancelButton: true,
      confirmButtonText: "Update",
      preConfirm: () => {
        const accessValue = document.getElementById("access").value;
        return { access: accessValue === "true" }; // Convert to boolean
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { access } = result.value;
        if (
          !Array.isArray(selectedUsers) ||
          selectedUsers.some((id) => typeof id !== "string")
        ) {
          console.error("❌ Invalid user IDs:", selectedUsers);
          Swal.fire("Error", "Invalid user IDs detected.", "error");
          return;
        }

        try {
          const requestBody = {
            userIds: selectedUsers,
            access,
          };

          const response = await axios.put(
            `${API_KEY}/api/users/bulk-access`,
            requestBody,
            { withCredentials: true }
          );

          if (response.status === 200) {
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                selectedUsers.includes(user._id) ? { ...user, access } : user
              )
            );

            Swal.fire(
              "Updated!",
              `Access has been set to ${access} for selected users.`,
              "success"
            );
          }
        } catch (error) {
          if (error.response?.status === 500) {
            try {
              const refreshResponse = await axios.get(
                `${API_KEY}/api/users/users`,
                { withCredentials: true }
              );
              setUsers(refreshResponse.data);
              Swal.fire(
                "Updated!",
                `Access has been set to ${access} for selected users. (Refreshed from server)`,
                "success"
              );
            } catch (refreshError) {
              Swal.fire(
                "Warning!",
                "Access may have been updated, but could not refresh the data. Please refresh the page.",
                "warning"
              );
            }
          } else {
            Swal.fire(
              "Error",
              "Failed to update access. Try again later.",
              "error"
            );
          }
        }
      }
    });
  }, [selectedUsers, setUsers]);

  // handle bulk tier
  const handleBulkAccessLevel = useCallback(() => {
    if (selectedUsers.length === 0) {
      Swal.fire(
        "No Users Selected",
        "Please select at least one user.",
        "warning"
      );
      return;
    }

    Swal.fire({
      title: "Update Tier Access for Selected Users",
      html: `
      <select id="accesslevel" class="swal2-select">
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
      </select>
    `,
      showCancelButton: true,
      confirmButtonText: "Update",
      preConfirm: () => {
        const accessLevelValue = document.getElementById("accesslevel").value;
        // Send the raw string ("free" or "pro") — not a boolean
        return { accessLevel: accessLevelValue };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { accessLevel } = result.value;
        if (
          !Array.isArray(selectedUsers) ||
          selectedUsers.some((id) => typeof id !== "string")
        ) {
          console.error("❌ Invalid user IDs:", selectedUsers);
          Swal.fire("Error", "Invalid user IDs detected.", "error");
          return;
        }

        try {
          const requestBody = {
            userIds: selectedUsers,
            // FIX: was `access` (undefined variable) instead of `accessLevel`
            accessLevel,
          };

          const response = await axios.put(
            `${API_KEY}/api/users/bulk-access-level-update`,
            requestBody,
            { withCredentials: true }
          );

          if (response.status === 200) {
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                selectedUsers.includes(user._id)
                  ? { ...user, accessLevel }
                  : user
              )
            );

            Swal.fire(
              "Updated!",
              `Tier Access has been set to ${accessLevel} for selected users.`,
              "success"
            );
          }
        } catch (error) {
          if (error.response?.status === 500) {
            try {
              const refreshResponse = await axios.get(
                `${API_KEY}/api/users/users`,
                { withCredentials: true }
              );
              setUsers(refreshResponse.data);
              Swal.fire(
                "Updated!",
                `Tier Access has been set to ${accessLevel} for selected users. (Refreshed from server)`,
                "success"
              );
            } catch (refreshError) {
              Swal.fire(
                "Warning!",
                "Tier Access may have been updated, but could not refresh the data. Please refresh the page.",
                "warning"
              );
            }
          } else {
            Swal.fire(
              "Error",
              "Failed to update tier access. Try again later.",
              "error"
            );
          }
        }
      }
    });
  }, [selectedUsers, setUsers]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(searchName.toLowerCase()) &&
        user.email.toLowerCase().includes(searchEmail.toLowerCase()) &&
        (statusFilter === "" || user.status === statusFilter) &&
        (roleFilter === "" || user.role === roleFilter) &&
        (accessFilter === "" || String(user.access) === accessFilter) &&
        (accessLevelFilter === "" ||
          String(user.accesslevel) === accessLevelFilter)
      );
    });
  }, [
    users,
    searchName,
    searchEmail,
    statusFilter,
    roleFilter,
    accessFilter,
    accessLevelFilter,
  ]);

  // Sorting: based on sortBy and sortOrder
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const valueA = new Date(a[sortBy] || 0);
      const valueB = new Date(b[sortBy] || 0);
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
  }, [filteredUsers, sortBy, sortOrder]);

  const currentUsers = useMemo(() => {
    return sortedUsers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedUsers, page, rowsPerPage]);

  if (loading)
    return (
      <div className="admin-root text-slate-900" style={{ padding: "20px" }}>
        <Typography>Loading users...</Typography>
      </div>
    );
  if (error)
    return (
      <div className="admin-root text-slate-900" style={{ padding: "20px" }}>
        <Typography color="error">Error: {error}</Typography>
      </div>
    );

  if (users.length === 0) {
    return (
      <div className="admin-root text-slate-900" style={{ padding: "20px" }}>
        <Typography variant="h5">Admin Panel</Typography>
        <Typography>No users found.</Typography>
        <Button onClick={handleAdd}>Add User</Button>
      </div>
    );
  }

  return (
    <Box className="admin-root admin-table-container">
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <Box className="admin-header">
            <Typography variant="h5">Admin Panel</Typography>
          </Box>
        </Grid>
        <Button onClick={handleAdd}>Add User</Button>

        <Grid item>
          <UserFilters
            searchEmail={searchEmail}
            setSearchEmail={setSearchEmail}
            searchName={searchName}
            setSearchName={setSearchName}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            accessFilter={accessFilter}
            setAccessFilter={setAccessFilter}
            accessLevelFilter={accessLevelFilter}
            setAccessLevelFilter={setAccessLevelFilter}
          />
        </Grid>
        {/* Sort filters */}
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
        {selectedUsers.length > 0 && (
          <Grid item>
            <Box className="bulk-actions">
              <Button
                variant="contained"
                color="primary"
                onClick={handleBulkEdit}
              >
                Bulk Edit
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleBulkDelete}
              >
                Bulk Delete
              </Button>
              <Button
                onClick={handleBulkAccess}
                variant="contained"
                color="primary"
              >
                Bulk Access Update
              </Button>
              <Button
                onClick={handleBulkAccessLevel}
                variant="contained"
                color="primary"
              >
                Bulk Tier Access Update
              </Button>
            </Box>
          </Grid>
        )}
        <Grid item>
          <TableContainer className="table-wrapper">
            <Table size="small">
              <TableHead className="table-header">
                <UserTableHeader
                  allSelected={selectedUsers.length === currentUsers.length}
                  indeterminate={
                    selectedUsers.length > 0 &&
                    selectedUsers.length < currentUsers.length
                  }
                  handleSelectAll={handleSelectAll}
                />
              </TableHead>
              <TableBody>
                {currentUsers.map((user) => (
                  <UserTableRow
                    key={user._id}
                    user={user}
                    isSelected={selectedUsers.includes(user._id)}
                    onCheckboxChange={handleCheckboxChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
            <TablePagination
              className="pagination"
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25]}
            />
          </TableContainer>
        </Grid>
      </Grid>
      {editDialogOpen && selectedUser && (
        <EditUserDialog
          open={editDialogOpen}
          user={selectedUser}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
        />
      )}
      {/* FIX: open={handleAdd} (a function) should be open={addDialogOpen} (a boolean) */}
      {addDialogOpen && (
        <AddUserDialog open={addDialogOpen} onClose={handleAddDialogClose} />
      )}
    </Box>
  );
};

export default UserPanel;
