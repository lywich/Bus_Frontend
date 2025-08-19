import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerImage from "./red-map-pin-icon-png.webp";

import {
  fetchVehicleRefs,
  fetchPublicRefs,
  fetchSpecificBusTrip,
  fetchSpecificBusRoute,
  fetchServerStatus,
} from "./ApiService";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import "./App.css";

const customMarkerIcon = L.icon({
  iconUrl: MarkerImage,
  iconSize: [24, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes expiry timer

function getCacheKey(type, ref) {
  return `geojson-cache-${type}-${ref}`;
}

// https://stackoverflow.com/questions/65322670/change-center-position-of-react-leaflet-map
function MapCenter({ geojson }) {
  const map = useMap();

  useEffect(() => {
    if (geojson && geojson.features?.length > 0) {
      const bounds = L.geoJSON(geojson).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [geojson, map]);

  return null;
}

function App() {
  const [geojson, setGeojson] = useState(null); // geo data
  const [geojsonVersion, setGeojsonVersion] = useState(0); // force GeoJSON rerender

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [formVisible, setFormVisible] = useState(true);

  const [vehRefInput, setVehRefInput] = useState(null);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehRef, setVehRef] = useState(null);

  const [publicRefInput, setPublicRefInput] = useState(null);
  const [publicRefOptions, setPublicRefOptions] = useState([]);
  const [publicRef, setPublicRef] = useState(null);

  const defaultCenter = [40.705808, -73.809474];
  const [center] = useState(defaultCenter);

  const toggleForm = () => {
    setFormVisible((visible) => !visible);
  };

  // Pop up details
  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      const {
        VehicleRef,
        PublishedLineName,
        DirectionRef,
        OriginName,
        DestinationName,
        StartTime,
        EndTime,
      } = feature.properties;

      let popupContent = `
        <b>Vehicle Ref:</b> ${VehicleRef || "N/A"}<br/>
        <b>Line Name:</b> ${PublishedLineName || "N/A"}<br/>
        <b>Direction:</b> ${DirectionRef || "N/A"}<br/>
        <b>Origin:</b> ${OriginName || "N/A"}<br/>
        <b>Destination:</b> ${DestinationName || "N/A"}<br/>
        <b>Start Time:</b> ${StartTime || "N/A"}<br/>
        <b>End Time:</b> ${EndTime || "N/A"}<br/>
        <hr/>
      `;
      layer.bindPopup(popupContent); // https://gis.stackexchange.com/questions/229723/displaying-properties-of-geojson-in-popup-on-leaflet
    }
  };

  // Get all bus and line numbers on start up
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      const status = await fetchServerStatus();
      if (status.data.status !== "Ready") {
        console.error("Server is down");
        setErrorMessage("Server is down. Please try again later");
        setShowError(true);
        return;
      }
      try {
        const [vehRes, pubRes] = await Promise.all([
          fetchVehicleRefs(),
          fetchPublicRefs(),
        ]);
        setVehicleOptions(
          vehRes.data.map((item) =>
            typeof item === "string" ? { label: item } : item
          )
        );
        setPublicRefOptions(
          pubRes.data.map((item) =>
            typeof item === "string" ? { label: item } : item
          )
        );
      } catch (error) {
        console.error("Error fetching refs:", error);
        setVehicleOptions([]);
        setPublicRefOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Fetch GeoJSON when vehRef or publicRef changes
  useEffect(() => {
    if (!vehRef && !publicRef) {
      setGeojson(null);
      return;
    }

    setLoading(true);
    setGeojson(null);

    // If vehRef is queried, fetch vehicle ref API, then filter by publicRef if set
    // Else if only publicRef set, fetch by publicRef API
    if (vehRef) {
      const cacheKey = getCacheKey("vehRef", vehRef);
      const cached = localStorage.getItem(cacheKey);
      const now = Date.now();

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp < CACHE_TTL) {
            let filteredData = parsed.data;
            if (publicRef) {
              filteredData = {
                ...parsed.data,
                features: parsed.data.features.filter(
                  (feature) =>
                    feature.properties?.PublishedLineName === publicRef
                ),
              };
            }
            if (filteredData.features && filteredData.features.length > 0) {
              setGeojson(filteredData);
              setGeojsonVersion((v) => v + 1);
            } else {
              setGeojson(null);
              setErrorMessage(
                `No route data found for VehicleRef "${vehRef}"` +
                (publicRef ? ` with PublicRef "${publicRef}"` : "")
              );
              setShowError(true);
            }
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to parse cache:", err);
        }
      }

      fetchSpecificBusTrip(vehRef)
        .then((response) => {
          let data = response.data;
          if (publicRef) {
            data = {
              ...data,
              features: data.features.filter(
                (feature) =>
                  feature.properties?.PublishedLineName === publicRef
              ),
            };
          }
          if (data.features && data.features.length > 0) {
            setGeojson(data);
            setGeojsonVersion((v) => v + 1);
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ data: response.data, timestamp: Date.now() })
            );
          } else {
            throw new Error("No matching features after filtering for Bus Number");
          }
        })
        .catch((error) => {
          console.error("Error fetching GeoJSON:", error);
          setErrorMessage("Error fetching data for Bus Number.");
          setShowError(true);
          setGeojson(null);
        })
        .finally(() => setLoading(false));
    } else if (publicRef) {
      // Only publicRef set, fetch by publicRef API
      const cacheKey = getCacheKey("publicRef", publicRef);
      const cached = localStorage.getItem(cacheKey);
      const now = Date.now();

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp < CACHE_TTL) {
            setGeojson(parsed.data);
            setGeojsonVersion((v) => v + 1);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to parse cache:", err);
        }
      }

      fetchSpecificBusRoute(publicRef)
        .then((response) => {
          const data = response.data;
          if (data.features && data.features.length > 0) {
            setGeojson(data);
            setGeojsonVersion((v) => v + 1);
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ data, timestamp: Date.now() })
            );
          } else {
            throw new Error("No matching features after filtering for Bus Route");
          }
        })
        .catch((error) => {
          console.error("Error fetching GeoJSON:", error);
          setErrorMessage("Error fetching data for Bus Route.");
          setShowError(true);
          setGeojson(null);
        })
        .finally(() => setLoading(false));
    }
  }, [vehRef, publicRef]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const vehValue = vehRefInput && (typeof vehRefInput === "string" ? vehRefInput : vehRefInput.label);
    const pubValue = publicRefInput && (typeof publicRefInput === "string" ? publicRefInput : publicRefInput.label);

    if (!vehValue && !pubValue) return; // empty input, do not do anything on submit

    if (vehValue) {
      setVehRef(vehValue);
      setPublicRef(pubValue || null);
    } else {
      setVehRef(null);
      setPublicRef(pubValue);
    }
  };

  return (
    <div className="map-wrapper" style={{ height: "100vh", width: "100%" }}>
      <button onClick={toggleForm} className="toggle-button" >
        {formVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>

      <form onSubmit={handleSubmit} className={`veh-ref-form ${formVisible ? "slide-in" : "slide-out-right"}`}>
        <div className="flex-container">
          <Autocomplete
            disablePortal
            options={vehicleOptions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label || ""
            }
            value={vehRefInput}
            onChange={(e, newValue) => setVehRefInput(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Enter Vehicle Ref (bus number)"
                variant="outlined"
              />
            )}
            sx={{ width: 300 }}
            freeSolo
          />
          <Autocomplete
            disablePortal
            options={publicRefOptions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label || ""
            }
            value={publicRefInput}
            onChange={(e, newValue) => setPublicRefInput(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Enter Public Ref (route)"
                variant="outlined"
              />
            )}
            sx={{ width: 300 }}
            freeSolo
          />
          <Button type="submit" variant="contained" color="primary">
            Submit
          </Button>
        </div>
      </form>

      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: "bot", horizontal: "right" }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <div style={{ position: "relative", height: "100vh", width: "100%" }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geojson && (
            <GeoJSON
              data={geojson}
              key={`${vehRef || publicRef}-${geojsonVersion}`}
              pointToLayer={(feature, latlng) =>
                L.marker(latlng, { icon: customMarkerIcon })
              }
              onEachFeature={onEachFeature}
            />
          )}
          <MapCenter geojson={geojson} />
        </MapContainer>

        {loading && (
          <div className="loading-overlay">
            <CircularProgress />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
