// UserTableHeader.jsx
import React from "react";
import { TableRow, TableCell, Checkbox } from "@mui/material";

const UserTableHeader = ({ allSelected, indeterminate, handleSelectAll }) => (
  <TableRow>
    <TableCell align="center">
      <Checkbox
        checked={allSelected}
        indeterminate={indeterminate}
        onChange={handleSelectAll}
      />
    </TableCell>
    <TableCell align="center">Avatar</TableCell>
    <TableCell align="center">Name</TableCell>
    <TableCell align="center">Email</TableCell>
    <TableCell align="center">Role</TableCell>
    <TableCell align="center">Status</TableCell>
    <TableCell align="center">Access</TableCell>
    <TableCell align="center">Tier</TableCell>
    <TableCell align="center">Total Logins</TableCell>
    <TableCell align="center">Actions</TableCell>
  </TableRow>
);

export default UserTableHeader;
