
# Sequence Diagram for key workflows

In this section, sequence diagram for key workflows of this application is detailed. Sequence Diagrams are created using the [mermaid.js syntax](https://mermaid.js.org/syntax/sequenceDiagram.html)

## 1. On start up
```mermaid
sequenceDiagram
    Website->>API: start up
    API-->>Website: All bus route names + All bus numbers
    Website->>Website: Set autocomplete options for user input
```

## 2. vehRef input is given with valid cache

```mermaid 
sequenceDiagram
    participant Website
    participant LocalStorage

    Website->>LocalStorage: get cached data for vehRef
    alt cache valid
        LocalStorage-->>Website: cached data
        Website->>Website: filter data by publicRef if set
        alt filtered features exist
            Website->>Website: render GeoJson data
        else no features after filter
            Website->>Website: show error message
        end
    end
```

## 3. VehRef input is given with invalid cache (by expiry, non-existence or broken data)

```mermaid
sequenceDiagram
    participant Website
    participant API
    participant LocalStorage

    Website->>LocalStorage: get cached data for vehRef
    alt cache missing or expired
        Website->>API: fetchSpecificBusTrip(vehRef)
        API-->>Website: response data
        Website->>Website: filter data by publicRef if set
        alt filtered features exist
            Website->>Website: render GeoJson data
        else no features after filter
            Website->>Website: show error message
        end
    end

```

## 4. VehRef input is empty, but publicRef input is given with valid cache

```mermaid
sequenceDiagram
    participant Website
    participant LocalStorage

    Website->>LocalStorage: get cached data for publicRef
    alt cache valid
        Website->>Website: render GeoJson data
    end
```

## 5. VehRef input is empty, but publicRef input is given with invalid cache (by expiry, non-existence or broken data)

```mermaid
sequenceDiagram
    participant Website
    participant API
    participant LocalStorage

    Website->>LocalStorage: get cached data for publicRef
    alt cache missing or expired
        Website->>API: fetchSpecificBusRoute(publicRef)
        API-->>Website: response data
        alt features exist
            Website->>Website: render GeoJson data
        else no features
            Website->>Website: show error message
        end
    end
```