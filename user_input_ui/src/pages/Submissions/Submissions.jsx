import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { tableContainer } from "./Submissions";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { JWTContext } from "../../context/Auth/AuthContext";
import { useContext } from "react";
import { NotificationContext } from "../../context/Notifications/Notifications";
import InfinitySpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const convertStringToDate = (isoDateString) => {
  // Create a Date object from the ISO string
  const date = new Date(isoDateString);

  // Define options for formatting the date
  const dateOptions = {
    day: "2-digit", // e.g., "11"
    month: "2-digit", // e.g., "01"
    year: "numeric", // e.g., "2025"
  };

  // Define options for formatting the time
  const timeOptions = {
    hour: "2-digit", // e.g., "07"
    minute: "2-digit", // e.g., "25"
    hour12: false, // Use 24-hour format
  };

  // Format the date and time
  const formattedDate = date.toLocaleDateString("en-GB", dateOptions); // 'en-GB' for day/month/year format
  const formattedTime = date.toLocaleTimeString("en-GB", timeOptions); // 'en-GB' for 24-hour time format

  // Combine the formatted date and time
  const formattedDateTime = `${formattedDate} ${formattedTime}`;

  return formattedDateTime; // Output: "11/01/2025 19:25"
};

const Submissions = () => {
  const setNotification = useContext(NotificationContext);
  const { jwt } = useContext(JWTContext);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const navigate = useNavigate();

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 180 },
    { field: "lat", headerName: "LAT", type: "number", width: 100 },
    { field: "lon", headerName: "LON", type: "number", width: 100 },
    { field: "createdAt", headerName: "Created At", width: 150 },
    { field: "updatedAt", headerName: "Updated At", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellClassName: (params) => {
        if (params.value === "Published") {
          return "status-published";
        } else if (params.value === "Under review") {
          return "status-under-review";
        }
        return "";
      },
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 60,
      renderCell: (params) => (
        <FontAwesomeIcon
          icon={faEdit}
          style={{ cursor: "pointer" }}
          onClick={() => handleEditClick(params.id)}
        />
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 60,
      renderCell: (params) => (
        <FontAwesomeIcon
          icon={faTrash}
          style={{ cursor: "pointer" }}
          onClick={() => handleDeleteClick(params.id, params.row.name)}
        />
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 5 };

  const fetchMySubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const responseBuildings = await axios.get(
        `${process.env.REACT_APP_STRAPI_URL}/api/buildings`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`, // Add API Key here
          },
        }
      );
      console.log("BUILDINGS", responseBuildings.data);
      setMySubmissions(
        responseBuildings.data.map((building) => {
          console.log(building);
          return {
            id: building.documentId,
            name: building.name,
            lat: building.lat,
            lon: building.lon,
            status: building.publishedAt ? "Published" : "Under review",
            createdAt: convertStringToDate(building.createdAt),
            updatedAt: convertStringToDate(building.updatedAt),
          };
        })
      );
      setIsLoadingSubmissions(false);
    } catch (error) {
      setNotification("error", "Error", "An error occured");
    }
  };

  const handleEditClick = (id) => {
    console.log(`Edit clicked for ID: ${id}`);
    // Implement your edit logic here
  };

  const handleDeleteClick = async (id, name) => {
    console.log(`Delete clicked for ID: ${id}`);
    const doDelete = window.confirm(`Do you really want to delete ${name}?`);
    if (doDelete) {
      try {
        const responseDelete = await axios.delete(
          `${process.env.REACT_APP_STRAPI_URL}/api/buildings/${id}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`, // Add API Key here
            },
          }
        );

        fetchMySubmissions();
      } catch (error) {
        setNotification("error", "Error", "When deleting the building");
      }
    }
  };
  useEffect(() => {
    fetchMySubmissions();
  }, []);
  return (
    <div style={tableContainer}>
      {isLoadingSubmissions && (
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
      {!isLoadingSubmissions && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "end",
            alignItems: "end",
            height: "100%",
            gap: 20,
            marginTop: "-5%",
          }}
        >
          <button
            style={{ fontSize: "18px" }}
            onClick={() => navigate("/annotate")}
          >
            New submission
          </button>

          <Paper sx={{ height: "80%" }}>
            <DataGrid
              rows={mySubmissions}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10, 15]}
              checkboxSelection
              sx={{ border: 0, backgroundColor: "rgb(178, 190, 186)" }}
            />
          </Paper>
        </div>
      )}
    </div>
  );
};

export default Submissions;
