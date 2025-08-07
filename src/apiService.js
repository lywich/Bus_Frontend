import axios from "axios";

const BASE_URL = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip";

export const fetchServerStatus = () => {
  return axios.get(`${BASE_URL}/ready`);
};

export const fetchVehRef = () => {
    return axios.get(`${BASE_URL}/getVehRef`);
};

export const fetchSpecificBusTrip = (vehRef) => {
    return axios.get(`${BASE_URL}/getBusTripByVehRef/${vehRef}`);
};

export const fetchBusLines = () => {
    return axios.get(`${BASE_URL}/getPubLineName`)
};

export const fetchSpecificBusLineDetail = (busLine) => {
    return axios.get(`${BASE_URL}/getBusTripByPubLineName/${busLine}`)
};
