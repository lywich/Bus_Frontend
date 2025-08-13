import axios from "axios";

const BASE_URL = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip";

export const fetchServerStatus = () => {
  return axios.get(`${BASE_URL}/ready`);
};

export const fetchVehicleRefs = () => {
    console.log("Fetching all bus number");
    return axios.get(`${BASE_URL}/getVehRef`);
};

export const fetchSpecificBusTrip = (vehRef) => {
    console.log("Fetching specific bus number trip");
    return axios.get(`${BASE_URL}/getBusTripByVehRef/${vehRef}`);
};

export const fetchPublicRefs = () => {
    console.log("Fetching all bus routes");
    return axios.get(`${BASE_URL}/getPubLineName`)
};

export const fetchSpecificBusRoute = (publicRef) => {
    console.log("Fetching specific bus route");
    return axios.get(`${BASE_URL}/getBusTripByPubLineName/${publicRef}`)
};
