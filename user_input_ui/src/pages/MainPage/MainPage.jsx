import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { JWTContext } from "../../context/Auth/AuthContext";
import GoogleButton from "react-google-button";
import InfinitySpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { NotificationContext } from "../../context/Notifications/Notifications";

const MainPage = () => {
  const [isLoadingLogin, setIsLoadingLogin] = useState(true);
  const navigate = useNavigate();
  const { setJwt, isValidUser, jwt } = useContext(JWTContext);
  const setNotification = useContext(NotificationContext);

  const params = useLocation().search;

  const handleLoginWithGoogle = () => {
    window.location = `${process.env.REACT_APP_STRAPI_URL}/api/connect/google`;
  };

  useEffect(() => {
    const callback = async () => {
      setIsLoadingLogin(true);
      let response = {};
      if (params) {
        response = await axios.get(
          `${process.env.REACT_APP_STRAPI_URL}/api/auth/google/callback${params}`
        );
        setJwt(response.data.jwt);
      }
      isValidUser(response?.data?.jwt || jwt).then((info) => {
        if (info.is_valid) {
          navigate("/annotate");
          setNotification("success", "Welcome");
        }
        setIsLoadingLogin(false);
      });
    };

    callback();
  }, [params]);
  return (
    <div
      style={{
        width: "100%",
        height: "90%",
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
        transform: "scale(1.2)",
      }}
    >
      {!isLoadingLogin && (
        <GoogleButton
          style={{ backgroundColor: "rgb(163, 214, 201)" }}
          type="light"
          onClick={handleLoginWithGoogle}
        />
      )}
      {isLoadingLogin && (
        <InfinitySpinner color={"rgb(53, 123, 131)"} width={200} />
      )}
    </div>
  );
};

export default MainPage;
