// UserFilters.jsx
import React from "react";
import { TextField, MenuItem, Grid } from "@mui/material";

const UserFilters = ({
  searchEmail,
  setSearchEmail,
  searchName,
  setSearchName,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  accessFilter, setAccessFilter,
  accessLevelFilter, setAccessLevelFilter,  // 👈 add this
}) => (
  <Grid
    container
    spacing={1}
    alignItems="center"
    justifyContent="space-between"
  >
    {/* LEFT FILTERS */}
    <Grid item>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <TextField
            select
            label="Filter by Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Verified">Verified</MenuItem>
            <MenuItem value="Unverified">Unverified</MenuItem>
          </TextField>
        </Grid>

        <Grid item>
          <TextField
            select
            label="Filter by Role"
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Pro">Pro</MenuItem>
          </TextField>
        </Grid>

        <Grid item>
          <TextField
            select
            label="Filter by Tier"
            size="small"
            value={accessLevelFilter}
            onChange={(e) => setAccessLevelFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Free">Free</MenuItem>
            <MenuItem value="Pro">Pro</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </Grid>

    {/* RIGHT SEARCH FIELDS (NO GAP DRAMA) */}
    <Grid item>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <TextField
            label="Search by Mail"
            size="small"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
        </Grid>

        <Grid item>
          <TextField
            label="Search by Name"
            size="small"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </Grid>
      </Grid>
    </Grid>
  </Grid>
);

export default UserFilters;
