import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const JWTContext = createContext();

export const JWTProvider = ({ children }) => {
  const [jwt, setJwt] = useState(localStorage.getItem("jwt") || null);
  useEffect(() => {
    if (jwt) {
      localStorage.setItem("jwt", jwt);
    } else {
      localStorage.removeItem("jwt");
    }
  }, [jwt]);

  const isValidUser = async (jwt) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_STRAPI_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      return { is_valid: true, data: res.data };
    } catch (error) {
      return { is_valid: false };
    }
  };

  return (
    <JWTContext.Provider value={{ jwt, setJwt, isValidUser }}>
      {children}
    </JWTContext.Provider>
  );
};
