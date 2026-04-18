// EditUserDialog.jsx
import React, { useState, useEffect } from "react";
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

const EditUserDialog = ({ open, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    access: false,
    accessLevel: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        status: user.status || "",
        access: user.access || false,
        accessLevel: user.accessLevel || "",
      });
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    const value =
      field === "access" ? event.target.value === "true" : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User Info</DialogTitle>
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
              // FIX: was `formData.accessLevel ? "free" : "pro"` which is always "free"
              // since both "Free" and "Pro" are truthy strings. Now uses value directly.
              value={formData.accessLevel}
              onChange={handleChange("accessLevel")}
            >
              {/* FIX: capitalized to match backend values "Free" / "Pro" */}
              <MenuItem value="Free">Free</MenuItem>
              <MenuItem value="Pro">Pro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Login Count:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={user.loginCount || 0}
              disabled
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;