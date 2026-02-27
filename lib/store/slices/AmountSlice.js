import { createSlice } from "@reduxjs/toolkit";

const amountSlice = createSlice({
  name:"amounts",
  initialState: {
    data: [],
  },
  reducers: {}
})

export const amountsReducers = amountSlice.reducer;