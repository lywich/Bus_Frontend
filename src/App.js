import React, { useEffect, useState } from "react";
import axios from "axios";
import { Polyline, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import MyImage from "./red-map-pin-icon-png.webp";

const customBusIcon = L.icon({
  iconUrl: MyImage,
  iconSize: [24, 32], 
  iconAnchor: [16, 32], 
  popupAnchor: [0, -32], 
});


function App() {
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/NYCT_2257")
      .then(response => {
        setGeojson(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching API data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading map data...</p>;
  if (!geojson) return <p>No data available. Please double check your input</p>;

  const coords = geojson.features[0].geometry.coordinates;

  // center map on first coordinate of the first trip
  const firstCoord = coords[0];
  const center = [firstCoord[1], firstCoord[0]];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {coords.map(([lng, lat], index) => (
        <Marker key={index} position={[lat, lng]} icon={customBusIcon}>
          <Popup>
            Point {index + 1} <br />
            Arrival: {geojson.features[0].properties[`Point ${index + 1}`]}
          </Popup>
        </Marker>
      ))}
      <Polyline positions={coords.map(([lng, lat]) => [lat, lng])} />
    </MapContainer>
  );
}

export default App;
