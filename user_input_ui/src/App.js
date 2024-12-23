import React, { Component } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AnnotateImage from "./pages/AnnotateImage.jsx";
import ImageAnnotator from "./pages/ImageAnnotator.jsx";
import "./App.css";
import AnnotateFloorPlan from "./pages/AnnotateFloorPlan/AnnotateFloorPlan.jsx";

const router = createBrowserRouter([
  // {
  //   path: "/",
  //   element: (
  //     <React.Fragment>
  //       <AnnotateImage />
  //     </React.Fragment>
  //   ),
  // },
  {
    path: "/",
    element: (
      <React.Fragment>
        <AnnotateFloorPlan />
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
  render() {
    return (
      <div className="app">
        <div className="container">
          <RouterProvider router={router} />
        </div>
      </div>
    );
  }
}

export default App;
