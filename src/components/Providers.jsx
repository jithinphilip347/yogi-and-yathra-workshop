"use client";
import React, { useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PushNotificationProvider } from "@/context/PushNotificationContext";
import { store, persistor } from "../../store";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <PushNotificationProvider>
            {children}
          </PushNotificationProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
