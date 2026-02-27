import { configureStore } from "@reduxjs/toolkit";

import { amountsReducers } from "./store/slices/AmountSlice";

export const store = configureStore({
  reducer: {
    amounts: amountsReducers,
  },
});

export {
    useAddBillMutation,
} from "./store/apis/AmountsApi";
