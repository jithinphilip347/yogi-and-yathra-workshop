import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { createMigrate } from "redux-persist";
import authReducer from "./src/features/auth/authSlice";
import wishlistReducer from "./src/features/wishlist/wishlistSlice";
import cartReducer from "./src/features/commerce/slices/cartSlice";
import checkoutReducer from "./src/features/commerce/slices/checkoutSlice";
import paymentReducer from "./src/features/commerce/slices/paymentSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  wishlist: wishlistReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  payment: paymentReducer,
});

const migratePersistedState = createMigrate({
  1: (persistedState) => {
    if (!persistedState) return persistedState;

    const previousCart = persistedState.cart || {};
    // The prior app stored one shared cart. Attribute it only when the persisted
    // auth state identifies its owner; otherwise keep it as an anonymous cart.
    const persistedUserId = persistedState.auth?.isAuthenticated
      ? persistedState.auth?.user?.id
      : null;
    const ownerId = persistedUserId === undefined || persistedUserId === null
      ? null
      : String(persistedUserId);
    const legacyCart = {
      items: Array.isArray(previousCart.items) ? previousCart.items : [],
      appliedCoupon: previousCart.appliedCoupon || null,
    };
    const cartsByUser = { ...(previousCart.cartsByUser || {}) };
    if (ownerId && !cartsByUser[ownerId]) cartsByUser[ownerId] = legacyCart;

    const migratedState = {
      ...persistedState,
      cart: {
        ...previousCart,
        activeOwnerId: ownerId,
        cartsByUser,
        guestCart: previousCart.guestCart || (ownerId
          ? { items: [], appliedCoupon: null }
          : legacyCart),
        items: legacyCart.items,
        appliedCoupon: legacyCart.appliedCoupon,
        isDrawerOpen: false,
        isProcessing: false,
        error: null,
        validation: {
          isValidating: false,
          lastValidated: null,
          checkoutSessionId: null,
          hasErrors: false,
          hasChanges: false,
          summary: null,
        },
      },
    };

    // These slices have no ownership marker, so an older persisted checkout or
    // payment snapshot cannot be safely assigned to an account.
    delete migratedState.checkout;
    delete migratedState.payment;
    return migratedState;
  },
});

const persistConfig = {
  key: "root",
  storage,
  version: 1,
  migrate: migratePersistedState,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
