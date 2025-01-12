import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { tableContainer } from "./Submissions";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { JWTContext } from "../../context/Auth/AuthContext";
import { NotificationContext } from "../../context/Notifications/Notifications";
import InfinitySpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { Button, Tooltip, Snackbar } from "@mui/material";

const convertStringToDate = (isoDateString) => {
  const date = new Date(isoDateString);
  const dateOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formattedDate = date.toLocaleDateString("en-GB", dateOptions);
  const formattedTime = date.toLocaleTimeString("en-GB", timeOptions);
  return `${formattedDate} ${formattedTime}`;
};

const Submissions = () => {
  const setNotification = useContext(NotificationContext);
  const { jwt } = useContext(JWTContext);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
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
        <Tooltip title="Edit">
          <FontAwesomeIcon
            icon={faEdit}
            style={{ cursor: "pointer", color: "#4CAF50", fontSize: "20px" }}
            onClick={() => handleEditClick(params.id)}
          />
        </Tooltip>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 60,
      renderCell: (params) => (
        <Tooltip title="Delete">
          <FontAwesomeIcon
            icon={faTrash}
            style={{ cursor: "pointer", color: "#F44336", fontSize: "20px" }}
            onClick={() => handleDeleteClick(params.id, params.row.name)}
          />
        </Tooltip>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 10 };

  const fetchMySubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const responseBuildings = await axios.get(
        `${process.env.REACT_APP_STRAPI_URL}/api/buildings`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      setMySubmissions(
        responseBuildings.data.map((building) => ({
          id: building.documentId,
          name: building.name,
          lat: building.lat,
          lon: building.lon,
          status: building.publishedAt ? "Published" : "Under review",
          createdAt: convertStringToDate(building.createdAt),
          updatedAt: convertStringToDate(building.updatedAt),
        }))
      );
      setIsLoadingSubmissions(false);
    } catch (error) {
      setNotification("error", "Error", "An error occurred");
    }
  };

  const handleEditClick = (id) => {
    navigate(`/annotate?building=${id}`);
  };

  const handleDeleteClick = async (id, name) => {
    const doDelete = window.confirm(`Do you really want to delete ${name}?`);
    if (doDelete) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_STRAPI_URL}/api/buildings/${id}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        setSnackbarMessage("Building deleted successfully!");
        setOpenSnackbar(true);
        fetchMySubmissions();
      } catch (error) {
        setSnackbarMessage("Error deleting building.");
        setOpenSnackbar(true);
      }
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  return (
    <div style={tableContainer}>
      {isLoadingSubmissions ? (
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
      ) : (
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/annotate")}
            style={{
              backgroundColor: "rgb(68, 129, 116)",
              fontSize: "18px",
              padding: "10px 20px",
              borderRadius: "30px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            New Submission
          </Button>

          <Paper sx={{ height: "80%", padding: "20px", borderRadius: "10px" }}>
            <DataGrid
              rows={mySubmissions}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10, 15]}
              checkboxSelection
              sx={{
                border: 0,
                backgroundColor: "rgb(245, 245, 245)",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                borderRadius: "10px",
              }}
            />
          </Paper>
        </div>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </div>
  );
};

export default Submissions;
