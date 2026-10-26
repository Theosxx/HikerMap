import { StyleSheet, Text, View } from "react-native";
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
        <Text style={styles.title}>Lokasi belum tersedia</Text>
        <Text>Menunggu koordinat GPS valid dari gateway RX.</Text>
      </View>
    );
  }

  const lat = latitude;
  const lon = longitude;

  const bbox = [
    lon - 0.005,
    lat - 0.005,
    lon + 0.005,
    lat + 0.005,
  ]
    .map((value) => value.toFixed(6))
    .join("%2C");

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: mapUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        onError={(event) =>
          console.log("OSM WEBVIEW ERROR:", event.nativeEvent)
        }
        onHttpError={(event) =>
          console.log("OSM HTTP ERROR:", event.nativeEvent.statusCode)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 350,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "#E4EBE2",
  },
  empty: {
    height: 350,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#EDF5EE",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#193B2A",
  },
});