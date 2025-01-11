import React, { createContext } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children, setNotification }) => (
  <NotificationContext.Provider value={setNotification}>
    {children}
  </NotificationContext.Provider>
);
