# NYC Bus Engine API Endpoints

To access the API endpoints, you may either paste the links in your browser or refer to [ApiService.js](../src/ApiService.js)

## 1. Check if server is ready

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/ready```


## 2. Get all Vehicle refs (Bus Numbers)

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getVehRef```

## 3. Get all Public Line names (Route Name)

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getPubLineName```

## 4. Get GeoJSON of all trips by a specific Vehicle refs (Bus Numbers)

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/NYCT_XXXX```

Replace XXXX with a valid Vehicle ref number

E.g. 

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/NYCT_4616```


## 4. Get GeoJSON of all trips of a Public Line (Route Name)

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/XXX```

Replace XXX with a valid Public Line name

E.g. 

```https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByPubLineName/Bx2```