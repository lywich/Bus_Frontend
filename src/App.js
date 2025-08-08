import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerImage from "./red-map-pin-icon-png.webp";
import { fetchSpecificBusTrip } from "./apiService";

const customMarkerIcon = L.icon({
  iconUrl: MarkerImage,
  iconSize: [24, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function App() {
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vehRefInput, setVehRefInput] = useState("");
  const [vehRef, setVehRef] = useState(null);
  const defaultCenter = [40.705808, -73.809474];
  const [center] = useState(defaultCenter);
  const mapRef = useRef();

  // Fetch GeoJSON when vehicle ref changes
  useEffect(() => {
    if (!vehRef) return;

    setLoading(true);

    // reset
    setGeojson(null);

    fetchSpecificBusTrip(vehRef)
      .then((response) => {
        const data = response.data;

        if (response.data.features && response.data.features.length > 0) {
          setGeojson(data);
        } else {
          throw new Error("Error fetching data: Something is wrong with received JSON");
        }
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        setGeojson(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [vehRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (vehRefInput.trim() === "") return;
    setVehRef(vehRefInput.trim());
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={vehRefInput}
          onChange={(e) => setVehRefInput(e.target.value)}
          placeholder="Enter bus reference (e.g. NYCT_XXXX)"
          style={{ padding: "0.5rem", width: "300px" }}
        />
        <button
          type="submit"
          style={{ padding: "0.5rem", marginLeft: "0.5rem" }}
        >
          Submit
        </button>
      </form>

      {loading && <p>Loading map data...</p>}
      {!loading && geojson === null && vehRef && (
        <p style={{ color: "red" }}>No route data found for "{vehRef}".</p>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
        scrollWheelZoom={true}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* This forces the map to render only if there is a valid geoJson and will rerender on each submit*/}
        {geojson && <GeoJSON data={geojson} key={vehRef} pointToLayer={(feature, latlng) =>
      L.marker(latlng, { icon: customMarkerIcon })
    }/>}
      </MapContainer>
    </div>
  );
}

export default App;
