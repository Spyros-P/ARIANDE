import React, { useContext, useEffect, useState } from "react";
import {
  header,
  headerImage,
  headerSection,
  headerSectionSmall,
  logo,
  small,
} from "./Header";

import logoImage from "../../assets/logo.png";
import { JWTContext } from "../../context/Auth/AuthContext";

export const Header = () => {
  const [user, setUser] = useState({ email: "", username: "", id: -1 });
  const { jwt, isValidUser, setJwt } = useContext(JWTContext);
  useEffect(() => {
    jwt
      ? isValidUser(jwt).then((info) => {
          if (info.is_valid) {
            setUser({
              email: info.data.email,
              username: info.data.username,
              id: info.data.id,
            });
            console.log("USSS", info);
          }
        })
      : setUser({ email: "", username: "", id: -1 });
  }, [jwt]);
  return (
    <div style={header}>
      <div style={headerSectionSmall}>
        <a href="/">
          <img src={logoImage} style={headerImage} />
        </a>
        <div>
          {" "}
          <a href="/" style={logo}>
            ARIADNE
          </a>
          <a href="/" style={small}>
            Admin
          </a>
        </div>
      </div>
      <div style={headerSection}></div>
      <div style={headerSectionSmall}>
        <a href="#" style={{ cursor: "default", color: "white" }}>
          {user.username}
        </a>
        {user.username && (
          <a
            className="logout"
            style={{
              cursor: "pointer",
              fontSize: 15,
              marginLeft: 30,
              padding: 10,
              borderRadius: "20%",
            }}
            onClick={() => setJwt(null)}
          >
            Logout
          </a>
        )}
      </div>
    </div>
  );
};

export default Header;
