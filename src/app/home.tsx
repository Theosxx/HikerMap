import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HikerMap from "./hiker-map";

type RxPosition = {
  counter: number;
  status: "FIX" | "NOFIX";
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  hdop: number;
  rssi: number;
  snr: number;
  receivedAt: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const [position, setPosition] = useState<RxPosition | null>(null);
  const [positionError, setPositionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchPosition() {
      try {
        if (!API_URL) {
          throw new Error(
            "EXPO_PUBLIC_API_URL belum dikonfigurasi."
          );
        }

        const response = await fetch(
          `${API_URL}/api/positions/latest`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Gagal mengambil data posisi RX."
          );
        }

        const data = result.data as RxPosition;

        if (
          typeof data?.latitude !== "number" ||
          typeof data?.longitude !== "number"
        ) {
          throw new Error(
            "Format koordinat dari backend tidak valid."
          );
        }

        if (active) {
          setPosition(data);
          setPositionError("");
        }
      } catch (error) {
        if (active) {
          setPositionError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data posisi."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchPosition();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const hasFix =
    position?.status === "FIX" &&
    position.latitude >= -90 &&
    position.latitude <= 90 &&
    position.longitude >= -180 &&
    position.longitude <= 180 &&
    (position.latitude !== 0 || position.longitude !== 0);

  const formatDate = (value?: string) => {
    if (!value) return "Belum ada data";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Waktu tidak valid"
      : date.toLocaleString("id-ID");
  };

  const openMap = () => {
    if (!hasFix || !position) return;

    const url =
      `https://www.openstreetmap.org/?mlat=${position.latitude}` +
      `&mlon=${position.longitude}` +
      `#map=17/${position.latitude}/${position.longitude}`;

    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F8F5"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </View>

            <View>
              <Text style={styles.brand}>HikerMap</Text>
              <Text style={styles.mountainName}>
                Gunung Buthak
              </Text>
            </View>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.welcomeSection}>
          <Text style={styles.eyebrow}>
            DASHBOARD PEMANTAUAN
          </Text>

          <Text style={styles.heading}>
            Pemantauan Pendaki
          </Text>

          <Text style={styles.description}>
            Pantau posisi pendaki dan kualitas komunikasi
            perangkat GPS dan LoRa secara berkala.
          </Text>
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Text style={styles.cardTitle}>
              Status data pendaki
            </Text>

            <Text style={styles.mutedText}>
              {loading
                ? "Menghubungkan ke server..."
                : position
                  ? `Status GPS: ${position.status}`
                  : positionError || "Menunggu data dari gateway RX"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              hasFix
                ? styles.statusOnline
                : styles.statusWaiting,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                hasFix
                  ? styles.statusOnlineText
                  : styles.statusWaitingText,
              ]}
            >
              {hasFix ? "GPS Aktif" : "Menunggu"}
            </Text>
          </View>
        </View>
        <Pressable
          style={[
            styles.refreshButton,
            loading && styles.refreshButtonDisabled,
          ]}
          onPress={() => {
            if (loading) return;

            setLoading(true);
            setRefreshKey((current) => current + 1);
          }}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? "Memuat data..." : "↻  Refresh Posisi"}
          </Text>
        </Pressable>      
        {/* Map */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Lokasi Pendaki
          </Text>

          <Text style={styles.sectionCaption}>
            OPENSTREETMAP
          </Text>
        </View>

        <View style={styles.mapCard}>
          <HikerMap
            latitude={
              hasFix && position ? position.latitude : null
            }
            longitude={
              hasFix && position ? position.longitude : null
            }
          />
        </View>

        {!hasFix && (
          <Text style={styles.mapNote}>
            {position?.status === "NOFIX"
              ? "Gateway RX menerima data, tetapi GPS belum mendapatkan fix."
              : positionError ||
                "Menunggu koordinat GPS valid dari gateway RX."}
          </Text>
        )}

        {/* Position information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Informasi Posisi
          </Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            icon="N"
            label="Latitude"
            value={
              hasFix && position
                ? position.latitude.toFixed(6)
                : "Belum tersedia"
            }
          />

          <View style={styles.divider} />

          <InfoRow
            icon="E"
            label="Longitude"
            value={
              hasFix && position
                ? position.longitude.toFixed(6)
                : "Belum tersedia"
            }
          />

          <View style={styles.divider} />

          <InfoRow
            icon="◷"
            label="Data terakhir diterima"
            value={formatDate(position?.receivedAt)}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="G"
            label="Jumlah satelit"
            value={
              position ? String(position.satellites) : "--"
            }
          />

          <View style={styles.divider} />

          <InfoRow
            icon="A"
            label="MDPL"
            value={
              position
                ? `${position.altitude.toFixed(1)} m`
                : "--"
            }
          />
        </View>

        {/* LoRa communication metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Kualitas Komunikasi
          </Text>

          <Text style={styles.sectionCaption}>LORA RX</Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="RSSI"
            unit="dBm"
            value={position?.rssi}
          />

          <MetricCard
            title="SNR"
            unit="dB"
            value={position?.snr}
          />

          <MetricCard
            title="HDOP"
            unit=""
            value={position?.hdop}
          />

          <MetricCard
            title="Counter RX"
            unit=""
            value={position?.counter}
          />
        </View>

        {hasFix && (
          <Pressable
            style={styles.openMapButton}
            onPress={openMap}
          >
            <Text style={styles.openMapText}>
              Buka lokasi di OpenStreetMap
            </Text>
          </Pressable>
        )}

        <Text style={styles.footer}>
          HikerMap · Sistem Pemantauan Pendaki Berbasis IoT
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.coordinateIcon}>
        <Text style={styles.coordinateIconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.coordinateContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function MetricCard({
  title,
  unit,
  value,
}: {
  title: string;
  unit: string;
  value?: number;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>
          {value !== undefined ? value : "--"}
        </Text>

        {!!unit && (
          <Text style={styles.metricUnit}>{unit}</Text>
        )}
      </View>

      <Text style={styles.metricCaption}>
        {value !== undefined
          ? "Data dari RX"
          : "Belum ada data"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
    refreshButton: {
    marginTop: 12,
    backgroundColor: "#166534",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  refreshButtonDisabled: {
    opacity: 0.6,
  },

  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8F5",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#166534",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },
  brand: {
    color: "#163B2A",
    fontSize: 21,
    fontWeight: "800",
  },
  mountainName: {
    color: "#748177",
    fontSize: 12,
    marginTop: 2,
  },
  welcomeSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  eyebrow: {
    color: "#378052",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#193B2A",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 7,
  },
  description: {
    color: "#718078",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E4EAE5",
    backgroundColor: "#FFFFFF",
  },
  statusContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    color: "#26392D",
    fontSize: 13,
    fontWeight: "700",
  },
  mutedText: {
    color: "#718078",
    fontSize: 11,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  statusOnline: {
    backgroundColor: "#DCFCE7",
  },
  statusWaiting: {
    backgroundColor: "#F5E8C7",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusOnlineText: {
    color: "#166534",
  },
  statusWaitingText: {
    color: "#805D17",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 27,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#193B2A",
    fontSize: 17,
    fontWeight: "800",
  },
  sectionCaption: {
    color: "#548062",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  mapCard: {
    height: 350,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#E4EBE2",
    borderWidth: 1,
    borderColor: "#DDE5DC",
  },
  mapNote: {
    color: "#718078",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4EAE5",
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  coordinateIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#EDF5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  coordinateIconText: {
    color: "#287344",
    fontSize: 15,
    fontWeight: "800",
  },
  coordinateContent: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    color: "#77837A",
    fontSize: 11,
  },
  value: {
    color: "#26392D",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF0ED",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    flexGrow: 1,
    flexBasis: "40%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4EAE5",
    borderRadius: 15,
    padding: 15,
  },
  metricTitle: {
    color: "#64746A",
    fontSize: 12,
    fontWeight: "600",
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 13,
    gap: 5,
  },
  metricValue: {
    color: "#193B2A",
    fontSize: 25,
    fontWeight: "800",
  },
  metricUnit: {
    color: "#718078",
    fontSize: 11,
  },
  metricCaption: {
    color: "#929B94",
    fontSize: 10,
    marginTop: 7,
  },
  openMapButton: {
    marginTop: 20,
    backgroundColor: "#166534",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  openMapText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  footer: {
    color: "#8A958D",
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 16,
  },
});
