import axios from "axios";

const BASE_URL = "INSERT API LINK HERE";

export const fetchServerStatus = () => {
	console.log("Fetching server status");
  return axios.get(`${BASE_URL}/ready`);
};

export const fetchVehicleRefs = () => {
    console.log("Fetching all bus numbers");
    return axios.get(`${BASE_URL}/getVehRef`);
};

export const fetchSpecificBusTrip = (vehRef) => {
    console.log("Fetching specific bus number trip: " + vehRef);
    return axios.get(`${BASE_URL}/getBusTripByVehRef/${vehRef}`);
};

export const fetchPublicRefs = () => {
    console.log("Fetching all bus routes");
    return axios.get(`${BASE_URL}/getPubLineName`)
};

export const fetchSpecificBusRoute = (publicRef) => {
    console.log("Fetching specific bus route: " + publicRef);
    return axios.get(`${BASE_URL}/getBusTripByPubLineName/${publicRef}`)
};
