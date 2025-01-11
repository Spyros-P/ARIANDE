import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { JWTContext } from "../context/Auth/AuthContext";
import Notification from "../components/Notification/Notification";
import { NotificationContext } from "../context/Notifications/Notifications";

export const Protector = ({ Component }) => {
  const { jwt, isValidUser } = useContext(JWTContext);
  const navigate = useNavigate();
  const setNotification = useContext(NotificationContext);

  useEffect(() => {
    if (!jwt) navigate("/");
    else if (!jwt || !isValidUser(jwt)) {
      navigate("/");
      setNotification("error", "Not allowed", "Login first!");
    }
  }, [navigate, jwt]);

  return <Component />;
};
