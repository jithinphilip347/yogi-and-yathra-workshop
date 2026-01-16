import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    isAuthenticated: false,
    token: null,
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLogin: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.token = action.payload.token;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
        },
        updateUser: (state, action) => {
            state.user = action.payload.user;
        }
    }


})

export const { setLogin, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
    
