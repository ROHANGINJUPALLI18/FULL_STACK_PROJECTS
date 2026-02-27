"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useForm } from "react-hook-form";
import { useFloatingAddContext } from "@/context/FloatingAddButton";

function AddBill() {
  const { isModalOpen, setIsModalOpen } = useFloatingAddContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onSubmit = (data) => {
    console.log("Form Data:", data);
    setIsModalOpen(false);
  };

  return (
    <Dialog
        open={isModalOpen}
        onClose={handleCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { minHeight: "90vh" },
        }}
      >
        <DialogTitle
          sx={{ textAlign: "center", color: "black", fontWeight: "bold" }}
        >
          Create Bill
        </DialogTitle>
        <DialogContent sx={{ paddingX: "10px" }}>
          <form onSubmit={handleSubmit(onSubmit)} className="pt-1" id="bill-form">
            {/* Date & Time */}
            <TextField
              fullWidth
              size="small"
              label="Date & Time"
              {...register("dateTime", { required: "Date & Time is required" })}
              type="datetime-local"
              InputLabelProps={{ shrink: true, style: { fontSize: "14px" } }}
              margin="normal"
              sx={{ marginBottom: "12px" }}
            />

            {/* Bill No */}
            <TextField
              fullWidth
              size="small"
              label="Bill No"
              {...register("billNo", { required: "Bill No is required" })}
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />

            {/* Name */}
            <TextField
              fullWidth
              size="small"
              label="Name"
              {...register("name", { required: "Name is required" })}
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />

            {/* Total Items */}
            <TextField
              fullWidth
              size="small"
              label="Total Items"
              {...register("totalItems", { required: "Total Items is required" })}
              type="number"
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />

            {/* Deposit Amount */}
            <TextField
              fullWidth
              size="small"
              label="Deposit Amount"
              {...register("depositAmount", { required: "Deposit Amount is required" })}
              type="number"
              inputProps={{ step: "0.01" }}
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />

            {/* Due Amount */}
            <TextField
              fullWidth
              size="small"
              label="Due Amount"
              {...register("dueAmount", { required: "Due Amount is required" })}
              type="number"
              inputProps={{ step: "0.01" }}
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />

            {/* Total Amount */}
            <TextField
              fullWidth
              size="small"
              label="Total Amount"
              {...register("totalAmount", { required: "Total Amount is required" })}
              type="number"
              inputProps={{ step: "0.01" }}
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />

            {/* Description */}
            <TextField
              fullWidth
              size="small"
              label="Description"
              {...register("description")}
              multiline
              rows={3}
              margin="normal"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              sx={{ marginBottom: "12px" }}
            />
          </form>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            form="bill-form"
            variant="contained"
            sx={{
              backgroundColor: "#000000",
              "&:hover": { backgroundColor: "#333333" },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
  )
}

export default AddBill