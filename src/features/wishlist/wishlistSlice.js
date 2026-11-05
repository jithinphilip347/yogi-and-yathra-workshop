import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  wishlist: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const exists = state.wishlist.some(
        (item) =>
          String(item.id) === String(action.payload.id) &&
          (item.type || "course") === (action.payload.type || "course")
      );
      if (!exists) {
        state.wishlist.push(action.payload);
      }
    },
    removeFromWishlist: (state, action) => {
      state.wishlist = state.wishlist.filter(
        (item) =>
          !(
            String(item.id) === String(action.payload.id) &&
            (item.type || "course") === (action.payload.type || "course")
          )
      );
    },
  },
});

export const { addToWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
