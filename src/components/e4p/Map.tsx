import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { Icon } from "leaflet";

const locations: { name: string; coords: [number, number] }[] = [
  { name: "Prague", coords: [50.0755, 14.4378] },
  { name: "Paris", coords: [48.8566, 2.3522] },
  { name: "New York", coords: [40.7128, -74.006] },
  { name: "Dubai", coords: [25.276987, 55.296249] },
  { name: "Beirut", coords: [33.8938, 35.5018] },
  { name: "Vancouver", coords: [49.2827, -123.1207] },
  { name: "Stockholm", coords: [59.3293, 18.0686] },
  { name: "London", coords: [51.5072, -0.1276] },
  { name: "Ontario", coords: [50.4452, -104.6189] }, // Approx in Canada
  { name: "Brussels", coords: [50.8503, 4.3517] },
  { name: "San Francisco", coords: [37.7749, -122.4194] },
  { name: "Sydney", coords: [-33.8688, 151.2093] },
  { name: "Frankfurt", coords: [50.1109, 8.6821] },
  { name: "Amsterdam", coords: [52.3676, 4.9041] },
  { name: "Ramallah", coords: [31.9038, 35.2034] },
  { name: "Cairo", coords: [30.0444, 31.2357] },
  { name: "Islamabad", coords: [33.6844, 73.0479] },
  { name: "Gaza", coords: [31.5, 34.4667] },
  { name: "Minneapolis", coords: [44.9778, -93.265] },
  { name: "Dublin", coords: [53.3498, -6.2603] },
  { name: "Musqat", coords: [23.588, 58.3829] },
  { name: "North Carolina", coords: [35.7596, -79.0193] },
  { name: "Pune", coords: [18.5204, 73.8567] },
  { name: "Ottawa", coords: [45.4215, -75.6999] },
  { name: "Edinburgh", coords: [55.9533, -3.1883] },
  { name: "DC", coords: [38.9072, -77.0369] },
  { name: "Florida", coords: [27.9944, -81.7603] },
  { name: "Manila", coords: [14.5995, 120.9842] },
  { name: "Toronto", coords: [43.65107, -79.347015] },
  { name: "Kuala Lumpur", coords: [3.139, 101.6869] },
  { name: "Marbella", coords: [36.5101, -4.8825] },
  { name: "Tenjo (Colombia)", coords: [4.8769, -74.1113] },
  { name: "Atlanta", coords: [33.749, -84.388] },
  { name: "Boston", coords: [42.3601, -71.0589] },
  { name: "Pittsburg", coords: [40.4406, -79.9959] },
  { name: "Austin", coords: [30.2672, -97.7431] },
  { name: "Ohio", coords: [40.4173, -82.9071] },
  { name: "Los Angeles", coords: [34.0522, -118.2437] },
  { name: "Madrid", coords: [40.4168, -3.7038] },
  { name: "Melbourne", coords: [-37.8136, 144.9631] },
  { name: "Phnom Penh", coords: [11.5564, 104.9282] },
  { name: "Doha", coords: [25.276987, 51.52] },
  { name: "Tunis", coords: [36.8065, 10.1815] },
  { name: "Kansas City", coords: [39.0997, -94.5786] },
  { name: "Seville", coords: [37.3891, -5.9845] },
  { name: "Sofia", coords: [42.6977, 23.3219] },
  { name: "Lahore", coords: [31.5204, 74.3587] },
  { name: "San Jose (Costa Rica)", coords: [9.9281, -84.0907] },
  { name: "Abu Dhabi", coords: [24.4539, 54.3773] },
  { name: "Chicago", coords: [41.8781, -87.6298] },
  { name: "Quebec", coords: [46.8139, -71.2082] },
  { name: "Berlin", coords: [52.52, 13.405] },
  { name: "Barcelona", coords: [41.3851, 2.1734] },
  { name: "Riyadh", coords: [24.7136, 46.6753] },
  { name: "New Delhi", coords: [28.6139, 77.209] },
  { name: "Hyderabad", coords: [17.385, 78.4867] },
  { name: "Mauritius", coords: [-20.3484, 57.5522] },
  { name: "Krakow", coords: [50.0647, 19.945] },
  { name: "Hague", coords: [52.0705, 4.3007] },
  { name: "Jeddah", coords: [21.4858, 39.1925] },
  { name: "Istanbul", coords: [41.0082, 28.9784] },
  { name: "Sarajevo", coords: [43.8486, 18.3564] },
  { name: "Bali", coords: [-8.4095, 115.1889] },
  { name: "Lisbon", coords: [38.7223, -9.1393] },
  { name: "Malmo", coords: [55.6059, 13.0007] },
  { name: "Geneva", coords: [46.2044, 6.1432] },
  { name: "Cape Town", coords: [-33.9249, 18.4241] },
  { name: "Oslo", coords: [59.9139, 10.7522] },
  { name: "Nairobi", coords: [-1.2921, 36.8219] },
  { name: "Bogor", coords: [-6.5971, 106.806] },
  { name: "Jakarta", coords: [-6.2088, 106.8456] },
  { name: "Calgary", coords: [51.0447, -114.0719] },
  { name: "Samsun", coords: [41.2867, 36.33] },
  { name: "Targoviste", coords: [44.9247, 25.4608] },
  { name: "Hebron", coords: [31.5326, 35.0998] },
  { name: "Nazareth", coords: [32.7024, 35.2973] },
  { name: "Haifa", coords: [32.794, 34.9896] },
  { name: "Seattle", coords: [47.6062, -122.3321] },
  { name: "Houston", coords: [29.7604, -95.3698] },
  { name: "Vienna", coords: [48.2081, 16.3713] },
];

const greenCircleMarker: Icon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="10" fill="#166534" stroke="white" stroke-width="3"/>
      </svg>
    `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

export default function MyLeafletMap() {
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {locations.map((loc, idx) => (
        <Marker key={idx} position={loc.coords as [number, number]} icon={greenCircleMarker}>
          <Popup>{loc.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
