import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerImage from "./red-map-pin-icon-png.webp";

import {
  fetchVehicleRefs,
  fetchPublicRefs,
  fetchSpecificBusTrip,
  fetchSpecificBusRoute,
} from "./ApiService";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

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

function App() {
  const [geojson, setGeojson] = useState(null); // geo data
  const [geojsonVersion, setGeojsonVersion] = useState(0); // force GeoJSON rerender

  const [loading, setLoading] = useState(false);
  const [isVehMode, setIsVehMode] = useState(true); // toggle between modes

  const [vehRefInput, setVehRefInput] = useState(null);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehRef, setVehRef] = useState(null);

  const [publicRefInput, setPublicRefInput] = useState(null);
  const [publicRefOptions, setPublicRefOptions] = useState([]);
  const [publicRef, setPublicRef] = useState(null);

  const defaultCenter = [40.705808, -73.809474];
  const [center] = useState(defaultCenter);
  const mapRef = useRef();

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
      layer.bindPopup(popupContent);
    }
  };

  useEffect(() => {
    if (!vehRef) return;

    setLoading(true);
    setGeojson(null);

    const cacheKey = getCacheKey("vehRef", vehRef);
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
        setGeojson(null);
        setLoading(false);
        console.error("Failed to parse data in cache:", err);
      }
    }

    fetchSpecificBusTrip(vehRef)
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
          throw new Error("Invalid GeoJSON Response");
        }
      })
      .catch((error) => {
        console.error("Error fetching GeoJSON:", error);
        setGeojson(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [vehRef]);

  useEffect(() => {
    if (!publicRef) return;

    setLoading(true);
    setGeojson(null);

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
        setGeojson(null);
        setLoading(false);
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
          throw new Error("Invalid GeoJSON Response");
        }
      })
      .catch((error) => {
        console.error("Error fetching GeoJSON:", error);
        setGeojson(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [publicRef]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [vehRes, pubRes] = await Promise.all([
          fetchVehicleRefs(),
          fetchPublicRefs(),
        ]);

        const vehicleData = vehRes.data.map((item) =>
          typeof item === "string" ? { label: item } : item
        );
        const publicData = pubRes.data.map((item) =>
          typeof item === "string" ? { label: item } : item
        );

        setVehicleOptions(vehicleData);
        setPublicRefOptions(publicData);
      } catch (error) {
        console.error("Error fetching vehicle/public refs:", error);
        setVehicleOptions([]);
        setPublicRefOptions([]);
      }
    };

    setLoading(true);
    fetchOptions();
    setLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedInput = isVehMode ? vehRefInput : publicRefInput;

    if (!selectedInput) return;

    const selectedValue =
      typeof selectedInput === "string"
        ? selectedInput
        : selectedInput.label;

    if (isVehMode) {
      setVehRef(selectedValue);
      setPublicRef(null);
    } else {
      setPublicRef(selectedValue);
      setVehRef(null);
    }
  };

  return (
    <div className="map-wrapper">
      <form onSubmit={handleSubmit} className="veh-ref-form">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ToggleButtonGroup
            value={isVehMode ? "vehicle" : "public"}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setIsVehMode(newValue === "vehicle");
              }
            }}
            aria-label="Reference Type Toggle"
          >
            <ToggleButton value="vehicle" aria-label="vehicle ref">
              Vehicle Ref
            </ToggleButton>
            <ToggleButton value="public" aria-label="public ref">
              Public Ref
            </ToggleButton>
          </ToggleButtonGroup>

          <Autocomplete
            disablePortal
            options={isVehMode ? vehicleOptions : publicRefOptions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label || ""
            }
            value={isVehMode ? vehRefInput : publicRefInput}
            onChange={(event, newValue) => {
              isVehMode
                ? setVehRefInput(newValue)
                : setPublicRefInput(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={isVehMode ? "Enter vehicle ref..." : "Enter public ref..."}
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

      {!loading && geojson === null && (vehRef || publicRef) && (
        <p style={{ color: "red" }}>
          No route data found for "{vehRef || publicRef}".
        </p>
      )}

      {/* Map + spinner overlay container */}
      <div style={{ position: "relative", height: "100vh", width: "100%" }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
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
        </MapContainer>

        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <CircularProgress />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
