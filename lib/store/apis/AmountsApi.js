import {createApi} from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery,fakeBaseQuery } from "@reduxjs/toolkit/query/react";

// firebase imports
import { addDoc,collection } from "firebase/firestore";
import { db } from "@/lib/firebase";



const amountsApi = createApi({
    reducerPath: "amountsApi",
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        AddBill: builder.mutation({
            async queryFn(newBill) {
                try {
                    const now = new Date().toISOString();
                    const payload = {
                        ...newBill,
                        createdAt: now,
                        updatedAt: now,
                        isDeleted: false,
                    };

                    const docRef = await addDoc(collection(db, "bills"), payload);
                    return { data: { id: docRef.id, ...payload } };
                } catch (error) {
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            error: error?.message || "Failed to add bill",
                        },
                    };
                }
            },
        }),
    }),
});



export const { 
    useAddBillMutation

} = amountsApi;

export { amountsApi };