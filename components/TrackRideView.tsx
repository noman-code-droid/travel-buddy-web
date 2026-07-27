'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  AlertTriangle,
  Camera,
  Share2,
  Navigation,
  X,
  User,
  Star,
  Loader2,
  Car
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { ActiveRideInfo } from '@/types';
import Button from './ui/Button';
import Card from './ui/Card';
import { androidMapStyle } from '@/lib/map-style';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

interface TrackRideViewProps {
  onClose: () => void;
  rideInfo: ActiveRideInfo | null;
}

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 31.5204, lng: 74.3587 };

export default function TrackRideView({ onClose, rideInfo }: TrackRideViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [rideData, setRideData] = useState<any>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // 1. Sync Ride Data from Firestore
  useEffect(() => {
    if (!rideInfo?.id) return;
    const unsub = onSnapshot(doc(db, "rides", rideInfo.id), (snapshot) => {
      if (snapshot.exists()) {
        setRideData(snapshot.data());
      }
    });
    return () => unsub();
  }, [rideInfo]);

  // 2. DRIVER LOGIC: Push GPS coordinates to database
  useEffect(() => {
    if (!rideInfo?.isDriver || !rideInfo?.id || !isLoaded) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await updateDoc(doc(db, "rides", rideInfo.id), {
            currentLat: latitude,
            currentLng: longitude,
            lastUpdated: serverTimestamp()
          });
        } catch (e) {
          console.error("GPS Update Failed", e);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [rideInfo, isLoaded]);

  // 3. Route Rendering
  useEffect(() => {
    if (!rideData || !window.google) return;
    const ds = new google.maps.DirectionsService();
    ds.route({
      origin: { lat: rideData.pickupLat, lng: rideData.pickupLng },
      destination: { lat: rideData.dropOffLat, lng: rideData.dropOffLng },
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') setDirections(result);
    });
  }, [rideData]);

  const handleSos = () => {
    const locUrl = rideData ? `https://www.google.com/maps?q=${rideData.currentLat || rideData.pickupLat},${rideData.currentLng || rideData.pickupLng}` : '';
    const msg = `🚨 *EMERGENCY SOS* 🚨\nI need help on my Travel Buddy ride!\n\n👤 *User:* ${auth.currentUser?.displayName}\n📍 *Loc:* ${locUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCall = () => {
    if (rideData?.driverPhone) window.open(`tel:${rideData.driverPhone}`);
    else alert("Phone coordination is active only during trip.");
  };

  const handleNavigation = () => {
    if (!rideData?.dropOffLat) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${rideData.dropOffLat},${rideData.dropOffLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (!rideInfo) return null;

  const currentPos = rideData?.currentLat ? { lat: rideData.currentLat, lng: rideData.currentLng } : defaultCenter;

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0 bg-black z-[70] flex flex-col">
      <div className="relative h-full flex flex-col">
        <div className="absolute inset-0 bg-[#121212]">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={currentPos}
              zoom={15}
              onLoad={setMap}
              options={{ disableDefaultUI: true, styles: androidMapStyle }}
            >
              {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#FFD500', strokeWeight: 5 }, preserveViewport: true }} />}

              {/* The "Live" Car Marker */}
              <MarkerF
                position={currentPos}
                icon={{
                  path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
                  fillColor: "#FFD500", fillOpacity: 1, strokeWeight: 0, scale: 1.5, anchor: new google.maps.Point(12, 12),
                  rotation: 0
                }}
              />
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#FFD500]" /></div>
          )}
        </div>

        <div className="absolute top-4 left-4 z-20">
          <button onClick={onClose} className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-90 transition-transform"><ArrowLeft className="text-white w-6 h-6 rotate-180" /></button>
        </div>

        <div className="absolute top-4 left-20 right-16 z-20">
          <Card radius="3xl" className="bg-black/80 backdrop-blur-md p-1.5 shadow-2xl border border-white/10 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-3 p-1">
              <div className="w-11 h-11 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-black">
                {rideInfo.driverPhoto ? <img src={rideInfo.driverPhoto} alt={rideInfo.driverName} className="w-full h-full object-cover" /> : <User className="text-black w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-white truncate uppercase tracking-tighter">{rideInfo.driverName}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FFD500] fill-[#FFD500]" />
                  <span className="text-[10px] text-[#FFD500] font-black">Verified</span>
                  <span className="text-[10px] text-[#666666] truncate ml-1">{rideInfo.vehicleSubtitle || 'Premium Trip'}</span>
                </div>
              </div>
              <button onClick={handleCall} className="w-11 h-11 bg-[#FFD500] rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"><Phone className="text-black w-5 h-5" /></button>
            </div>
          </Card>
        </div>

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          <button onClick={handleSos} className="w-12 h-12 bg-[#E46767] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><AlertTriangle className="text-white w-6 h-6" /></button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Tracking my ride: " + window.location.href)}`, '_blank')} className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-90 transition-transform"><Share2 className="text-white w-6 h-6" /></button>
          <button onClick={handleNavigation} className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-90 transition-transform"><Navigation className="text-[#FFD500] w-6 h-6" /></button>
        </div>

        <div className="mt-auto bg-black rounded-t-[40px] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-white/5 z-30">
          <div className="w-12 h-1.5 bg-[#222222] rounded-full mx-auto mb-8" />
          <div className="flex justify-between items-start mb-6">
             <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
                  {rideData?.status ? rideData.status.replace("_", " ") : 'ON THE WAY'}
                </h2>
                <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">{rideData?.vehicleMake} {rideData?.vehicleModel} • {rideData?.registrationNumber}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-[#FFD500] uppercase mb-1">Fare Share</p>
                <p className="text-xl font-black text-white">RS {rideData?.price || '---'}</p>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Button variant="secondary" className="!h-14 !rounded-[20px] font-black text-xs uppercase tracking-widest" onClick={onClose}>Minimize</Button>
             <Button variant="destructive" className="!h-14 !rounded-[20px] font-black text-xs uppercase tracking-widest opacity-50 cursor-not-allowed">Cancel</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
