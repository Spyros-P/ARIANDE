import React from "react";
import {
  header,
  headerImage,
  headerSection,
  headerSectionSmall,
  logo,
  small,
} from "./Header";

import logoImage from "../../assets/logo.png";

export const Header = () => {
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
        {" "}
        <a href="#" style={{ color: "white" }}>
          About
        </a>
      </div>
    </div>
  );
};

export default Header;
