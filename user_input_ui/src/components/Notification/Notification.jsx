import "react-notifications/lib/notifications.css";

import React, { useEffect } from "react";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";

const Notification = ({ type, title, message }) => {
  const createNotification = (notification_type) => {
    return () => {
      switch (notification_type) {
        case "info":
          NotificationManager.info(message);
          break;
        case "success":
          NotificationManager.success(message, title);
          break;
        case "warning":
          NotificationManager.warning(message, title, 3000);
          break;
        case "error":
          NotificationManager.error(
            message,
            title,
            5000,
            () => {
              alert("callback");
            },
            "custom-class"
          );
          break;
      }
    };
  };

  useEffect(() => {
    type && createNotification(type)();
  }, [type]);

  return (
    <div>
      <NotificationContainer />
    </div>
  );
};

export default Notification;
