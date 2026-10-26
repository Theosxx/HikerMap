
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type HikerMapProps = {
  latitude: number | null;
  longitude: number | null;
};

export default function HikerMap({
  latitude,
  longitude,
}: HikerMapProps) {
  const validPosition =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    (latitude !== 0 || longitude !== 0);

  if (!validPosition) {
    return (
      <View style={styles.empty}>
        <View>
          <View />
        </View>
      </View>
    );
  }

  const lat = latitude as number;
  const lon = longitude as number;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
          .hiker-marker {
            width: 30px;
            height: 30px;
            background: #dc2626;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,.45);
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const lat = ${lat};
          const lon = ${lon};

          const map = L.map('map').setView([lat, lon], 16);

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }
          ).addTo(map);

          const hikerIcon = L.divIcon({
          className: '',
            html: '<div class="hiker-marker"></div>',
            iconSize: [50, 50],
            iconAnchor: [15, 15]
          });

          L.marker([lat, lon], { icon: hikerIcon })
            .addTo(map)
            .bindPopup('Lokasi Pendaki')
            .openPopup();
        </script>
      </body>
    </html>
  `;

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        {React.createElement("iframe", {
          key: `${lat},${lon}`,
          srcDoc: mapHtml,
          title: "Peta lokasi pendaki",
          width: "100%",
          height: "100%",
          style: { border: 0, display: "block" },
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={`${lat},${lon}`}
        source={{ html: mapHtml }}
        style={{ flex: 1, backgroundColor: "#E4EBE2" }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  empty: {
    flex: 1,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDF5EE",
  },
});
