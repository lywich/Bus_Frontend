import React, { useEffect, useState } from "react";
import { Polyline, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import MarkerImage from "./red-map-pin-icon-png.webp";
import { fetchSpecificBusTrip } from "./apiService"

const customBusIcon = L.icon({
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
  const defaultCenter = [40.705808, -73.809474]; // default center taken from NYCT_2257
  const [center, setCenter] = useState(defaultCenter);
  const [coords, setCoords] = useState([]);

  // re-renders the map when the user submits a bus number query
  useEffect(() => {
    if (!vehRef) return;

    setLoading(true);
    fetchSpecificBusTrip(vehRef)
      .then((response) => {
        setGeojson(response.data);
        const receivedCoords = response.data.features?.[0]?.geometry?.coordinates || []; // TODO: inform user that api query failed
        setCoords(receivedCoords);
        if (receivedCoords && receivedCoords.length > 0) {
          const firstCoord = receivedCoords[0];
          // center around the first coordinate received
          setCenter([firstCoord[1], firstCoord[0]]); 
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        // TODO: Handle invalid input gracefully
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
        <button type="submit" style={{ padding: "0.5rem", marginLeft: "0.5rem" }}>
          Submit
        </button>
      </form>

      {loading && <p>Loading map data...</p>}

      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: "80vh", width: "100%" }} 
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render markers and polyline only if data is valid. TODO: handle if invalid input*/}
        {coords.length > 0 &&
          coords.map(([lng, lat], index) => (
            <Marker key={index} position={[lat, lng]} icon={customBusIcon}>
              <Popup>
                Point {index + 1} <br />
                Arrival: {geojson.features[0].properties[`Point ${index + 1}`]}
              </Popup>
            </Marker>
          ))}

        {coords.length > 0 && <Polyline positions={coords.map(([lng, lat]) => [lat, lng])} />}
      </MapContainer>
    </div>
  );
}

export default App;
