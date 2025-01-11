import React, { Component, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AnnotateImage from "./pages/AnnotateImage.jsx";
import ImageAnnotator from "./pages/ImageAnnotator.jsx";
import "./App.css";
import AnnotateFloorPlan from "./pages/AnnotateFloorPlan/AnnotateFloorPlan.jsx";
import Header from "./components/Header/Header.jsx";
import { WindowSizeProvider } from "./context/WindowSize/WindowSize.jsx";
import MainPage from "./pages/MainPage/MainPage.jsx";
import { JWTProvider } from "./context/Auth/AuthContext.js";
import { Protector } from "./utils/protector.js";
import Notification from "./components/Notification/Notification.jsx";
import { NotificationProvider } from "./context/Notifications/Notifications.js";
import Submissions from "./pages/Submissions/Submissions.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <React.Fragment>
        <MainPage />
      </React.Fragment>
    ),
  },
  {
    path: "/annotate",
    element: (
      <React.Fragment>
        <Protector Component={AnnotateFloorPlan}></Protector>
      </React.Fragment>
    ),
  },
  {
    path: "/submissions",
    element: (
      <React.Fragment>
        <Protector Component={Submissions}></Protector>
      </React.Fragment>
    ),
  },
  // {
  //   path: "/annotator",
  //   element: (
  //     <React.Fragment>
  //       <ImageAnnotator />
  //     </React.Fragment>
  //   ),
  // },
]);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notification: "", // Initial notification type
      title: "",
      message: "",
    };
  }

  setNotification = (type, title, message) => {
    this.setState({ notification: type, title: title, message: message });
    setTimeout(() => {
      this.setState({ notification: "", title: "", message: "" });
    }, 10);
  };
  render() {
    const { notification, title, message } = this.state;
    return (
      <JWTProvider>
        <WindowSizeProvider>
          <NotificationProvider setNotification={this.setNotification}>
            <div className="app">
              <Notification
                type={notification}
                title={title}
                message={message}
              />
              <Header />
              <div className="container">
                <RouterProvider router={router} />
              </div>
            </div>{" "}
          </NotificationProvider>
        </WindowSizeProvider>
      </JWTProvider>
    );
  }
}

export default App;
