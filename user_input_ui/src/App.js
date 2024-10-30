import React, { Component } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AnnotateImage from './pages/AnnotateImage.jsx'
import './App.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <React.Fragment>
        <AnnotateImage />
      </React.Fragment>
    ),
  },
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
