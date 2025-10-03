export const locations = [
  {
    id: 1,
    name: "Argentina",
    code: "ARG",
    lat: -34.6118,
    lng: -58.396, // Buenos Aires
    timezone: "UTC-3",
    region: "South America",
    description:
      "Argentina's capital, vibrant startup culture and creative industries.",
  },
  {
    id: 2,
    name: "Bangladesh",
    code: "BGD",
    lat: 23.8103,
    lng: 90.4125, // Dhaka
    timezone: "UTC+6",
    region: "South Asia",
    description:
      "Bangladesh's capital and largest city, major commercial center.",
  },
  {
    id: 3,
    name: "Japan",
    code: "JPN",
    lat: 35.6762,
    lng: 139.6503, // Tokyo
    timezone: "UTC+9",
    region: "Asia",
    description: "Japan's capital, global technology and financial leader.",
  },
  {
    id: 4,
    name: "Kenya",
    code: "KEN",
    lat: -1.2921,
    lng: 36.8219, // Nairobi
    timezone: "UTC+3",
    region: "Africa",
    description: "Kenya's capital, East Africa's tech and innovation hub.",
  },
  {
    id: 5,
    name: "United States",
    code: "USA",
    lat: 40.7128,
    lng: -74.006, // New York City
    timezone: "UTC-5",
    region: "North America",
    description: "USA's largest city, global financial capital.",
  },
  {
  "id": 6,
  "name": "Chile",
  "code": "CHL",
  "lat": -33.4489,
  "lng": -70.6693, 
  "timezone": "UTC-3",
  "region": "South America",
  "description": "Chile’s capital Santiago is known for its vibrant culture, modern economy, and growing startup ecosystem."
}
];

// export const arcTypes = [
//   // Core NASA Terra Instruments
//   {
//     name: "MODIS",
//     color: "#FF1744",
//     description: "Moderate Resolution Imaging Spectroradiometer",
//   },
//   {
//     name: "ASTER",
//     color: "#00E676",
//     description:
//       "Advanced Spaceborne Thermal Emission and Reflection Radiometer",
//   },
//   {
//     name: "CERES",
//     color: "#2979FF",
//     description: "Clouds and the Earth's Radiant Energy System",
//   },
//   {
//     name: "MISR",
//     color: "#FF6D00",
//     description: "Multi-angle Imaging SpectroRadiometer",
//   },
//   {
//     name: "MOPITT",
//     color: "#9C27B0",
//     description: "Measurements of Pollution in the Troposphere",
//   },

//   // Environmental Data Streams
//   { name: "Climate", color: "#00BCD4", description: "Climate data exchange" },
//   {
//     name: "Atmospheric",
//     color: "#4CAF50",
//     description: "Atmospheric monitoring",
//   },
//   { name: "Ocean", color: "#3F51B5", description: "Ocean temperature data" },
//   { name: "Land", color: "#FF5722", description: "Land surface monitoring" },
//   { name: "Ice", color: "#607D8B", description: "Ice and snow coverage" },
//   { name: "Carbon", color: "#795548", description: "Carbon cycle monitoring" },
//   {
//     name: "Aerosol",
//     color: "#FFC107",
//     description: "Aerosol and pollution tracking",
//   },

//   // Additional Earth Observation Data
//   {
//     name: "Temperature",
//     color: "#E91E63",
//     description: "Surface temperature monitoring",
//   },
//   {
//     name: "Vegetation",
//     color: "#8BC34A",
//     description: "Vegetation index tracking",
//   },
//   {
//     name: "CloudCover",
//     color: "#9E9E9E",
//     description: "Cloud coverage analysis",
//   },
//   {
//     name: "Precipitation",
//     color: "#03A9F4",
//     description: "Rainfall and precipitation data",
//   },
//   {
//     name: "AirQuality",
//     color: "#FFEB3B",
//     description: "Air pollution monitoring",
//   },
//   { name: "UVRadiation", color: "#FF9800", description: "UV radiation levels" },
//   { name: "SnowCover", color: "#E0E0E0", description: "Snow and ice coverage" },
//   { name: "DroughtIndex", color: "#8D6E63", description: "Drought monitoring" },
//   {
//     name: "FireDetection",
//     color: "#D32F2F",
//     description: "Wildfire detection",
//   },
//   { name: "FloodMonitoring", color: "#1976D2", description: "Flood tracking" },
//   {
//     name: "CoastalChanges",
//     color: "#00796B",
//     description: "Coastal erosion monitoring",
//   },
//   {
//     name: "UrbanHeat",
//     color: "#F57C00",
//     description: "Urban heat island effect",
//   },
// ];

// Vibrant backup colors
export const colors = ["#FFFF00", "#FF6347", "#40FF00"];

// Simple function to generate multiple arcs between each country pair
export const generateArcsData = () => {
  const arcsData = [];
  let arcId = 0;

  for (let i = 0; i < locations.length; i++) {
    for (let j = 0; j < locations.length; j++) {
      if (i !== j) {
        const startCountry = locations[i];
        const endCountry = locations[j];

        // Create 12 arcs between each country pair (simple numbered arcs)
        for (let arcNum = 1; arcNum <= 12; arcNum++) {
          arcsData.push({
            id: `arc-${arcId++}`,
            name: `${startCountry.code} → ${endCountry.code} (${arcNum})`,
            startLat: startCountry.lat,
            startLng: startCountry.lng,
            endLat: endCountry.lat,
            endLng: endCountry.lng,
            color: colors[(arcNum - 1) % colors.length], // Cycle through colors
            arcNumber: arcNum,
            startCountry: startCountry.code,
            endCountry: endCountry.code,
            animateTime: 500 + arcNum * 150,
            strokeWidth: 0.1 + arcNum * 0.02,
            dashLength: 0.2 + arcNum * 0.03,
            dashGap: 0.15,
          });
        }
      }
    }
  }

  return arcsData;
};

// Generate stars data
export const generateStarsData = (count = 10000) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const distance = 150 + Math.random() * 100;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);

    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = distance * Math.sin(phi) * Math.sin(theta);
    const z = distance * Math.cos(phi);

    stars.push({
      x,
      y,
      z,
      size: Math.random() * 1.5 + 0.5,
    });
  }
  return stars;
};

// Simple utility functions
export const getArcsByCountry = (countryCode) => {
  const arcs = generateArcsData();
  return arcs.filter(
    (arc) => arc.startCountry === countryCode || arc.endCountry === countryCode
  );
};

export const getConnectionBetweenCountries = (country1, country2) => {
  const arcs = generateArcsData();
  return arcs.filter(
    (arc) =>
      (arc.startCountry === country1 && arc.endCountry === country2) ||
      (arc.startCountry === country2 && arc.endCountry === country1)
  );
};
