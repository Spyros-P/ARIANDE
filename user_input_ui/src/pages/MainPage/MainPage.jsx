import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { JWTContext } from "../../context/Auth/AuthContext";
import GoogleButton from "react-google-button";
import InfinitySpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { NotificationContext } from "../../context/Notifications/Notifications";
import Image from "../../assets/mainPageImage2.png";
import Logo from "../../assets/logo.png";

import {
  mainPageColumnContainer,
  mainPageColumnsContainer,
  mainPageContainer,
} from "./MainPage";

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
          navigate("/submissions");
          if (params) setNotification("success", "Welcome");
        }
        setIsLoadingLogin(false);
      });
    };

    callback();
  }, [params]);
  return (
    <div style={mainPageContainer}>
      {!isLoadingLogin && (
        <div style={mainPageColumnsContainer}>
          <div
            style={{
              ...mainPageColumnContainer,
              flex: 2.5,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `url(${Image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                zIndex: 0,
                opacity: 0.1,
              }}
            ></div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                color: "white",
                textAlign: "center",
                padding: "20px",
                animation: "fadeIn 2s ease-in-out",
              }}
            >
              {/* Logo and Tagline */}
              <div
                style={{
                  marginBottom: "20px",
                  animation: "slideDown 1s ease-out",
                }}
              >
                <img
                  src={Logo} // Replace with your logo URL
                  alt="Ariadne Logo"
                  style={{
                    width: "150px",
                    height: "auto",
                    marginBottom: "10px",
                  }}
                />
                <h1
                  style={{ fontSize: "3rem", fontWeight: "bold", margin: "0" }}
                >
                  Ariadne
                </h1>
                <p
                  style={{
                    fontSize: "1.2rem",
                    fontStyle: "italic",
                    marginTop: "10px",
                  }}
                >
                  A General Purpose Indoor Navigation System
                </p>
              </div>

              {/* Features Section */}
              <div
                style={{
                  margin: "20px 0",
                  maxWidth: "800px",
                  animation: "fadeInUp 1.5s ease-out",
                }}
              >
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: "600",
                    marginBottom: "15px",
                  }}
                >
                  Key Features
                </h2>
                <ul
                  style={{
                    listStyleType: "none",
                    padding: 0,
                    textAlign: "left",
                  }}
                >
                  <li
                    style={{
                      fontSize: "1.1rem",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        marginRight: "10px",
                        color: "rgb(163, 214, 201)",
                      }}
                    >
                      ✔
                    </span>
                    An indoor navigation system based on the analysis of floor
                    plans using advanced ML models and computer vision
                    techniques.
                  </li>
                  <li
                    style={{
                      fontSize: "1.1rem",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        marginRight: "10px",
                        color: "rgb(163, 214, 201)",
                      }}
                    >
                      ✔
                    </span>
                    User localization achieved through BLE beacons, enabling
                    offline usage without requiring an internet connection.
                  </li>
                  <li
                    style={{
                      fontSize: "1.1rem",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        marginRight: "10px",
                        color: "rgb(163, 214, 201)",
                      }}
                    >
                      ✔
                    </span>
                    Administrators can upload building floor plans, which are
                    analyzed and processed into a centralized CMS for easy
                    management.
                  </li>
                  <li
                    style={{
                      fontSize: "1.1rem",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        marginRight: "10px",
                        color: "rgb(163, 214, 201)",
                      }}
                    >
                      ✔
                    </span>
                    Floor plan graphs are generated automatically by analyzing
                    the structure of the floor plan, simplifying navigation
                    setup for any building.
                  </li>
                  <li
                    style={{
                      fontSize: "1.1rem",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        marginRight: "10px",
                        color: "rgb(163, 214, 201)",
                      }}
                    >
                      ✔
                    </span>
                    Seamless integration with ARIADNE mobile app, which allows
                    users to navigate through complex indoor spaces.
                  </li>
                </ul>
              </div>

              {/* Call to Action Section */}
              <div
                style={{
                  margin: "20px 0",
                  animation: "zoomIn 1.5s ease-in-out",
                }}
              ></div>

              {/* Animation Keyframes */}
              <style>
                {`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideDown {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeInUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes zoomIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `}
              </style>
            </div>
          </div>

          <div
            style={{
              ...mainPageColumnContainer,
              backgroundColor: "rgb(198, 204, 201)", // Light background for contrast
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Adds depth
              padding: "20px",
              animation: "fadeIn 1.5s ease-out",
              height: "100vh",
            }}
          >
            {!isLoadingLogin && (
              <>
                {/* Welcome Text */}
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: "600",
                    marginBottom: "15px",
                    color: "rgb(53, 123, 131)",
                    textAlign: "center",
                  }}
                >
                  Welcome to Ariadne
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "rgb(80, 80, 80)",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  Seamless indoor navigation is just a click away. Log in to get
                  started!
                </p>

                {/* Google Login Button */}
                <GoogleButton
                  style={{
                    backgroundColor: "rgb(163, 214, 201)",
                    padding: "15px 20px",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "block",
                    margin: "0 auto",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
                    transition: "transform 0.3s ease",
                  }}
                  type="light"
                  onClick={handleLoginWithGoogle}
                  onMouseEnter={(e) =>
                    (e.target.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                >
                  Log in with Google
                </GoogleButton>

                {/* Divider */}
                <div
                  style={{
                    margin: "20px 0",
                    borderTop: "1px solid rgb(200, 200, 200)",
                    width: "80%",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                ></div>

                {/* Benefits Section */}
                <div
                  style={{
                    textAlign: "center",
                    animation: "slideUp 1s ease-out",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "500",
                      marginBottom: "10px",
                      color: "rgb(53, 123, 131)",
                    }}
                  >
                    Why Use Ariadne?
                  </h3>
                  <ul
                    style={{
                      listStyleType: "none",
                      padding: 0,
                      color: "rgb(80, 80, 80)",
                      fontSize: "1rem",
                      textAlign: "left",
                      margin: "0 auto",
                      maxWidth: "300px",
                    }}
                  >
                    <li style={{ marginBottom: "10px" }}>
                      <span
                        style={{
                          fontSize: "1.2rem",
                          marginRight: "10px",
                          color: "rgb(74, 133, 123)",
                        }}
                      >
                        ✔
                      </span>
                      Effortless Indoor Navigation
                    </li>
                    <li style={{ marginBottom: "10px" }}>
                      <span
                        style={{
                          fontSize: "1.2rem",
                          marginRight: "10px",
                          color: "rgb(74, 133, 123)",
                        }}
                      >
                        ✔
                      </span>
                      Offline Functionality
                    </li>
                    <li style={{ marginBottom: "10px" }}>
                      <span
                        style={{
                          fontSize: "1.2rem",
                          marginRight: "10px",
                          color: "rgb(74, 133, 123)",
                        }}
                      >
                        ✔
                      </span>
                      Streamlined Management
                    </li>
                  </ul>
                </div>
              </>
            )}

            {isLoadingLogin && (
              <div
                style={{
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  transform: "scale(1.2)",
                }}
              >
                <InfinitySpinner color={"rgb(53, 123, 131)"} width={200} />
              </div>
            )}

            {/* Animation Keyframes */}
            <style>
              {`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `}
            </style>
          </div>
        </div>
      )}

      {isLoadingLogin && (
        <div
          style={{
            justifyContent: "center",
            display: "flex",
            alignItems: "center",
            transform: "scale(1.2)",
          }}
        >
          <InfinitySpinner color={"rgb(53, 123, 131)"} width={200} />
        </div>
      )}
    </div>
  );
};

export default MainPage;
