import React from "react";
import {
  TableRow,
  TableCell,
  Checkbox,
  Avatar,
  IconButton,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const UserTableRow = ({
  user,
  isSelected,
  onCheckboxChange,
  onEdit,
  onDelete,
}) => (
  <TableRow className={isSelected ? "selected-row" : ""}>
    <TableCell align="center">
      <Checkbox
        checked={isSelected}
        onChange={() => onCheckboxChange(user._id)}
      />
    </TableCell>
    <TableCell align="center">
      <Avatar alt={user.name} src={user.avatar} />
    </TableCell>
    <TableCell align="center">{user.name}</TableCell>
    <TableCell align="center">{user.email}</TableCell>
    <TableCell
      align="center"
      sx={user.role === "Admin" ? { color: "red", fontWeight: 600 } : {}}
    >
      {user.role}
    </TableCell>

    {/* Status chip */}
    <TableCell align="center">
      <Chip
        label={user.status}
        size="medium"
        sx={{
          bgcolor: user.status === "Verified" ? "lightgreen" : "#FFD580",
          color: user.status === "Verified" ? "black" : "inherit",
          fontWeight: 300,
          borderRadius: 2,
        }}
      />
    </TableCell>

    {/* Access chip */}
    <TableCell align="center">
      <Chip
        label={user.access ? "True" : "False"}
        size="medium"
        sx={{
          bgcolor: user.access ? "lightgreen" : "pink",
          color: user.access ? "black" : "inherit",
          fontWeight: 300,
          borderRadius: 2,
        }}
      />
    </TableCell>

    {/* Tier chip */}
    <TableCell align="center">
      <Chip
        label={user.accessLevel || "—"}
        size="medium"
        sx={{
          bgcolor:
            user.accessLevel === "Pro"
              ? "#3381ff"
              : user.accessLevel === "Free"
              ? "lightgreen"
              : "#e2e8f0",
          color: user.accessLevel === "Pro" ? "white" : "black",
          fontWeight: 300,
          borderRadius: 2,
        }}
      />
    </TableCell>

    <TableCell align="center">{user.loginCount || 0}</TableCell>
    <TableCell align="center">
      <IconButton onClick={() => onEdit(user)} color="primary" size="small">
        <EditIcon />
      </IconButton>
      <IconButton onClick={() => onDelete(user._id)} color="error" size="small">
        <DeleteIcon />
      </IconButton>
    </TableCell>
  </TableRow>
);

export default UserTableRow;