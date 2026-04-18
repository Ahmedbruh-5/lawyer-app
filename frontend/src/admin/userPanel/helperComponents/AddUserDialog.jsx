// AddUserDialog.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import { userAPI } from "../../../services/apiService";
import Swal from "sweetalert2";

const AddUserDialog = ({ open, onClose, refreshUsers }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "",
    access: false,
    accessLevel: "Free",
  });

  const handleChange = (field) => (event) => {
    const value =
      field === "access" ? event.target.value === "true" : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    userAPI
      .addUser(formData)
      .then((response) => {
        Swal.fire("Added!", response.data.message, "success");
        onClose();
        // Optionally reset the form fields
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "",
          status: "",
          access: false,
          accessLevel: "Free",
        });
        // Optionally, refresh the user list if you have a function to do so
        if (refreshUsers) refreshUsers();
      })
      .catch((error) => {
        console.error("Error adding user:", error);
        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not add new user.";
        Swal.fire("Error!", backendMessage, "error");
      });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New User</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Name:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange("name")}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Email:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={handleChange("email")}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Password:</Typography>
            <TextField
              fullWidth
              type="password"
              variant="outlined"
              value={formData.password}
              onChange={handleChange("password")}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Role:</Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={formData.role}
              onChange={handleChange("role")}
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Pro">Pro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Status:</Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={formData.status}
              onChange={handleChange("status")}
            >
              <MenuItem value="Verified">Verified</MenuItem>
              <MenuItem value="Unverified">Unverified</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Access:</Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={formData.access ? "true" : "false"}
              onChange={handleChange("access")}
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Tier:</Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={formData.accessLevel}
              onChange={handleChange("accessLevel")}
            >
              <MenuItem value="Free">Free</MenuItem>
              <MenuItem value="Pro">Pro</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserDialog;
