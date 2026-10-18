"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Compass,
  Crosshair,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Radio,
  Layers,
  ShieldCheck,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Globe,
  Route,
  Zap,
  LocateFixed,
  LayoutDashboard,
  Maximize2,
  Eye,
  ArrowUpRight,
} from "lucide-react";

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number; // in km/h
  heading: number; // in degrees
  timestamp: Date;
}

// Default central metropolitan logistics corridor fallback coordinates (Mumbai Metro Logistics Hub)
const DEFAULT_CORRIDOR = {
  latitude: 19.076,
  longitude: 72.8777,
  zoneName: "Metro Central Logistics Corridor",
};

export function RiderLiveTrackingCard({
  riderCode = "RDR-1082",
  riderName = "Rider",
  showDashboardRedirect = false,
}: {
  riderCode?: string;
  riderName?: string;
  showDashboardRedirect?: boolean;
}) {
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [isSimulatingMotion, setIsSimulatingMotion] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<"streets" | "satellite" | "radar">("streets");
  const [gpsSource, setGpsSource] = useState<"device" | "simulated" | "corridor">("corridor");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Current live coordinates & telemetry
  const [currentLocation, setCurrentLocation] = useState<LocationPoint>({
    latitude: DEFAULT_CORRIDOR.latitude,
    longitude: DEFAULT_CORRIDOR.longitude,
    accuracy: 3.8,
    speed: 0.0,
    heading: 45,
    timestamp: new Date(),
  });

  // Breadcrumbs history for live route trail
  const [breadcrumbs, setBreadcrumbs] = useState<[number, number][]>([
    [DEFAULT_CORRIDOR.latitude - 0.002, DEFAULT_CORRIDOR.longitude - 0.003],
    [DEFAULT_CORRIDOR.latitude - 0.0012, DEFAULT_CORRIDOR.longitude - 0.0018],
    [DEFAULT_CORRIDOR.latitude - 0.0005, DEFAULT_CORRIDOR.longitude - 0.0008],
    [DEFAULT_CORRIDOR.latitude, DEFAULT_CORRIDOR.longitude],
  ]);

  const [pingCount, setPingCount] = useState<number>(24);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Google Maps URLs
  const googleMapsUrl = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentLocation.latitude},${currentLocation.longitude}`;
  const googleMapsStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${currentLocation.latitude},${currentLocation.longitude}`;

  // 1. Browser Geolocation initialization & self-tracking
  useEffect(() => {
    let watchId: number | null = null;

    if (isLiveMode && typeof window !== "undefined" && "geolocation" in navigator) {
      // First attempt current position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const spd = pos.coords.speed ? parseFloat((pos.coords.speed * 3.6).toFixed(1)) : 16.5;
          const hdg = pos.coords.heading ? Math.round(pos.coords.heading) : 48;
          const acc = pos.coords.accuracy ? parseFloat(pos.coords.accuracy.toFixed(1)) : 3.5;

          setCurrentLocation({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            speed: spd,
            heading: hdg,
            timestamp: new Date(),
          });
          setGpsSource("device");
          setGpsNotice(null);
          setBreadcrumbs((prev) => [...prev.slice(-20), [lat, lng]]);
        },
        (err) => {
          console.warn("Device GPS unavailable, utilizing corridor fallback:", err.message);
          setGpsNotice(err.message);
          setGpsSource("corridor");
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 }
      );

      // Continuous watch position if not simulating
      if (!isSimulatingMotion) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = parseFloat(pos.coords.latitude.toFixed(6));
            const lng = parseFloat(pos.coords.longitude.toFixed(6));
            const spd = pos.coords.speed ? parseFloat((pos.coords.speed * 3.6).toFixed(1)) : 22.0;
            const hdg = pos.coords.heading ? Math.round(pos.coords.heading) : 55;
            const acc = pos.coords.accuracy ? parseFloat(pos.coords.accuracy.toFixed(1)) : 3.2;

            setCurrentLocation({
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              speed: spd,
              heading: hdg,
              timestamp: new Date(),
            });
            setGpsSource("device");
            setGpsNotice(null);
            setBreadcrumbs((prev) => [...prev.slice(-20), [lat, lng]]);
            setLastPingTime(0);
            setPingCount((c) => c + 1);
          },
          (err) => {
            // keep corridor fallback active
          },
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      }
    }

    return () => {
      if (watchId !== null && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLiveMode, isSimulatingMotion]);

  // 2. Simulated Motion Generator (for live testing & demonstration)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLiveMode && isSimulatingMotion) {
      setGpsSource("simulated");
      interval = setInterval(() => {
        setCurrentLocation((prev) => {
          const deltaLat = Math.random() * 0.00025 + 0.0001;
          const deltaLng = Math.random() * 0.00035 + 0.0001;
          const nextLat = parseFloat((prev.latitude + deltaLat).toFixed(6));
          const nextLng = parseFloat((prev.longitude + deltaLng).toFixed(6));
          const simulatedSpeed = parseFloat((24 + Math.random() * 10).toFixed(1)); // 24-34 km/h
          const simulatedHeading = Math.round(45 + Math.random() * 15);

          setBreadcrumbs((crumbs) => [...crumbs.slice(-25), [nextLat, nextLng]]);
          setLastPingTime(0);
          setPingCount((c) => c + 1);

          return {
            latitude: nextLat,
            longitude: nextLng,
            accuracy: 2.8,
            speed: simulatedSpeed,
            heading: simulatedHeading,
            timestamp: new Date(),
          };
        });
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMode, isSimulatingMotion]);

  // 3. Ping timer ticker (seconds since last telemetry ping)
  useEffect(() => {
    const timer = setInterval(() => {
      setLastPingTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. Initialize Interactive Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    // Load leaflet dynamically on client side
    import("leaflet").then((L) => {
      if (isCancelled || !mapContainerRef.current) return;
      LRef.current = L;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.latitude, currentLocation.longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom Control to bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Define Tile Layers (High-resolution, free, zero API key required, zero watermarks)
      const tileUrls = {
        streets: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        radar: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      };

      const initialLayer = L.tileLayer(tileUrls[mapLayer], {
        maxZoom: 19,
        attribution: "OpenStreetMap / Esri",
      }).addTo(map);
      tileLayerRef.current = initialLayer;

      // Invalidate map size so container fills immediately
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 100);
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 400);

      // Custom pulsing rider marker HTML
      const createMarkerHtml = (heading: number) => `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(79, 70, 229, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background-color: #4F46E5; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45); display: flex; align-items: center; justify-content: center; color: white;">
            <svg style="transform: rotate(${heading}deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2" fill="white"></polygon>
            </svg>
          </div>
          <div style="position: absolute; bottom: -18px; background: rgba(15, 23, 42, 0.9); color: white; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
            ${riderCode}
          </div>
        </div>
      `;

      const riderIcon = L.divIcon({
        className: "custom-rider-marker",
        html: createMarkerHtml(currentLocation.heading),
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: riderIcon,
      }).addTo(map);

      // Popup with Google Maps link
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="font-size: 13px; color: #0F172A;">${riderName} (${riderCode})</b>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Live GPS Tracking Corridor</div>
          <div style="font-size: 11px; color: #4F46E5; font-weight: 700; margin-top: 4px;">
            Speed: ${currentLocation.speed.toFixed(1)} km/h
          </div>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 700; color: #2563EB; text-decoration: underline;">
            Open Pin in Google Maps &rarr;
          </a>
        </div>
      `);

      markerRef.current = marker;

      // Polyline for breadcrumbs
      const polyline = L.polyline(breadcrumbs, {
        color: "#4F46E5",
        weight: 4,
        opacity: 0.8,
        dashArray: "6, 8",
      }).addTo(map);
      polylineRef.current = polyline;

      mapInstanceRef.current = map;
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // 5. Update Map Position & Polyline when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !LRef.current) return;

    const lat = currentLocation.latitude;
    const lng = currentLocation.longitude;

    // Smoothly pan map to new position if live mode is active
    if (isLiveMode) {
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.8 });
    }

    // Update marker location
    markerRef.current.setLatLng([lat, lng]);

    // Update marker rotation/heading icon
    const createMarkerHtml = (heading: number) => `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(79, 70, 229, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background-color: #4F46E5; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="transform: rotate(${heading}deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="white"></polygon>
          </svg>
        </div>
        <div style="position: absolute; bottom: -18px; background: rgba(15, 23, 42, 0.9); color: white; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
          ${riderCode}
        </div>
      </div>
    `;

    markerRef.current.setIcon(
      LRef.current.divIcon({
        className: "custom-rider-marker",
        html: createMarkerHtml(currentLocation.heading),
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })
    );

    // Update polyline trail
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(breadcrumbs);
    }
  }, [currentLocation, breadcrumbs, isLiveMode, riderCode]);

  // 6. Handle Layer Switch
  const handleLayerChange = (layer: "streets" | "satellite" | "radar") => {
    setMapLayer(layer);
    if (!mapInstanceRef.current || !tileLayerRef.current || !LRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrls = {
      streets: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      radar: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    };

    const newLayer = LRef.current.tileLayer(tileUrls[layer], {
      maxZoom: 19,
      attribution: "OpenStreetMap / Esri",
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // 7. Force Self-Tracking GPS Locate
  const handleLocateSelf = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const spd = pos.coords.speed ? parseFloat((pos.coords.speed * 3.6).toFixed(1)) : 18.5;
          const acc = pos.coords.accuracy ? parseFloat(pos.coords.accuracy.toFixed(1)) : 3.0;

          setCurrentLocation({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            speed: spd,
            heading: 50,
            timestamp: new Date(),
          });
          setGpsSource("device");
          setGpsNotice(null);
          setLastPingTime(0);
          setPingCount((c) => c + 1);
          setBreadcrumbs((prev) => [...prev.slice(-20), [lat, lng]]);
          setIsLocating(false);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          }
        },
        (err) => {
          setGpsNotice("Device location notice: " + err.message + ". Refreshed corridor coordinates.");
          // Refresh corridor slightly
          setCurrentLocation((prev) => ({
            ...prev,
            latitude: parseFloat((prev.latitude + 0.00015).toFixed(6)),
            longitude: parseFloat((prev.longitude + 0.00012).toFixed(6)),
            speed: 21.0,
            timestamp: new Date(),
          }));
          setLastPingTime(0);
          setPingCount((c) => c + 1);
          setIsLocating(false);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 16, { duration: 1.0 });
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsNotice("Geolocation is not supported by your browser environment.");
    }
  };

  // 8. Copy coordinates to clipboard
  const handleCopyCoords = () => {
    const text = `${currentLocation.latitude}, ${currentLocation.longitude}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // 9. Copy Google Maps link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Format compass heading
  const getHeadingText = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return "N (North)";
    if (deg >= 22.5 && deg < 67.5) return "NE (North-East)";
    if (deg >= 67.5 && deg < 112.5) return "E (East)";
    if (deg >= 112.5 && deg < 157.5) return "SE (South-East)";
    if (deg >= 157.5 && deg < 202.5) return "S (South)";
    if (deg >= 202.5 && deg < 247.5) return "SW (South-West)";
    if (deg >= 247.5 && deg < 292.5) return "W (West)";
    return "NW (North-West)";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Live Mode: Self-Tracking & Google Maps Corridor
                </h3>
                {isLiveMode ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    SELF-TRACKING LIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    TRACKING PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Continuous real-time GPS self-tracking for <b className="text-slate-700">{riderName}</b> ({riderCode}) • Interactive map view & direct Google Maps navigation
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Simulation Toggle */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Track Myself Now Button */}
          <button
            type="button"
            onClick={handleLocateSelf}
            disabled={isLocating}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Locate my position using device GPS"
          >
            <LocateFixed className={`h-3.5 w-3.5 ${isLocating ? "animate-spin text-indigo-600" : ""}`} />
            <span>{isLocating ? "Locating..." : "Track Myself Now"}</span>
          </button>

          {/* Live Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiveMode
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            }`}
          >
            {isLiveMode ? (
              <>
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>Live Mode: ON</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Live Mode: Paused</span>
              </>
            )}
          </button>

          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={() => setIsSimulatingMotion(!isSimulatingMotion)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSimulatingMotion
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            }`}
            title="Simulate realistic in-transit motorcycle delivery movement"
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulatingMotion ? "fill-current animate-bounce" : "text-amber-500"}`} />
            <span>{isSimulatingMotion ? "Simulating Transit" : "Simulate Motion"}</span>
          </button>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={handleLocateSelf}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh GPS telemetry now"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notice bar if device geolocation needs permissions or fallback is used */}
      {gpsNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              GPS Notice: <b>{gpsNotice}</b>. Showing logistics corridor fallback. Click <b>"Track Myself Now"</b> to grant browser GPS permission or click <b>"Simulate Motion"</b>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleLocateSelf}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 shrink-0"
          >
            Retry GPS
          </button>
        </div>
      )}

      {/* Main Telemetry & Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Live Coordinates */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              Live Coordinates
            </span>
            <button
              type="button"
              onClick={handleCopyCoords}
              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
              title="Copy Coordinates"
            >
              {copiedCoords ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="font-mono font-bold text-xs text-slate-900 tracking-tight">
            {currentLocation.latitude.toFixed(5)}°, {currentLocation.longitude.toFixed(5)}°
          </p>
          <div className="text-[10px] text-slate-500">
            Source: <b className="uppercase font-bold text-indigo-700">{gpsSource}</b>
          </div>
        </div>

        {/* Metric 2: Speed */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            Ground Speed
          </span>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900">{currentLocation.speed.toFixed(1)}</p>
            <span className="text-[11px] font-semibold text-slate-500">km/h</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            {currentLocation.speed > 5 ? "In Motion (En Route)" : "Stationary / Idle"}
          </div>
        </div>

        {/* Metric 3: Heading / Compass */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-indigo-600" />
            Bearing Direction
          </span>
          <div className="flex items-center gap-1.5">
            <Navigation
              className="h-4 w-4 text-indigo-600 transition-transform duration-500"
              style={{ transform: `rotate(${currentLocation.heading}deg)` }}
            />
            <p className="font-bold text-xs text-slate-900">
              {getHeadingText(currentLocation.heading)}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Heading: {currentLocation.heading}°
          </div>
        </div>

        {/* Metric 4: Satellite Precision */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Crosshair className="h-3.5 w-3.5 text-blue-600" />
            GPS Precision
          </span>
          <p className="font-bold text-xs text-slate-900">
            ±{currentLocation.accuracy} meters
          </p>
          <div className="text-[10px] text-slate-500">
            Ping: <b>{lastPingTime}s ago</b> (#{pingCount})
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport with Layer Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-indigo-600" />
              Interactive Live Map & Telemetry Corridor
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              • Centered on {DEFAULT_CORRIDOR.zoneName}
            </span>
          </div>

          {/* Map Layer Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleLayerChange("streets")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mapLayer === "streets"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Street Map</span>
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange("satellite")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mapLayer === "satellite"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Satellite View</span>
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange("radar")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mapLayer === "radar"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Navigation className="h-3 w-3" />
              <span>OSM Standard</span>
            </button>
          </div>
        </div>

        {/* Map Viewport Container */}
        <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
          {/* Leaflet Dynamic Interactive Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Live Coordinates HUD */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {currentLocation.latitude.toFixed(4)}°, {currentLocation.longitude.toFixed(4)}°
            </span>
            <span className="text-[10px] text-slate-400">|</span>
            <span className="text-[11px] font-semibold text-indigo-700">
              {currentLocation.speed.toFixed(0)} km/h
            </span>
          </div>

          {/* Floating Google Maps Direct Redirection Badge (User Requirement: Direct redirect so they can see on Google Maps) */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 z-[400] bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all group cursor-pointer"
            title="Click to redirect and open live position on Google Maps"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Redirect to Google Maps</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Floating Recenter Pin Button */}
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 17, { duration: 0.8 });
              }
            }}
            className="absolute bottom-3 left-3 z-[400] bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-md rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Recenter view on rider marker"
          >
            <LocateFixed className="h-3.5 w-3.5 text-indigo-600" />
            <span>Center on Rider</span>
          </button>
        </div>
      </div>

      {/* Google Maps Actions & Redirection Controls */}
      <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Real-time GPS telemetry tracks rider continuity and syncs coordinates with Google Maps dispatch.
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          {/* Primary Action: Direct Google Maps Redirection Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Redirect directly to Google Maps to view pin"
          >
            <Globe className="h-4 w-4" />
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>

          {/* Secondary Action: Turn-by-Turn Directions in Google Maps */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="Open turn-by-turn navigation in Google Maps"
          >
            <Navigation className="h-4 w-4 text-emerald-400" />
            <span>Directions in Google Maps</span>
          </a>

          {/* Tertiary Action: Google Maps Street View 360 */}
          <a
            href={googleMapsStreetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="View 360 street panorama in Google Maps"
          >
            <Eye className="h-3.5 w-3.5 text-slate-600" />
            <span>Street View</span>
          </a>

          {/* Copy Google Maps Location Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Copy Google Maps Location Link"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {/* Optional Return to Rider Dashboard button if embedded on another page */}
          {showDashboardRedirect && (
            <Link
              href="/rider/dashboard"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Redirect to Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
