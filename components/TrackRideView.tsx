'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MessageSquare, AlertTriangle, Camera, Share2, Navigation, X, User, Star, Loader2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { ActiveRideInfo } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import { androidMapStyle } from '@/lib/map-style';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

  // Replicating startRideLiveTracking from TrackRideActivity.kt
  useEffect(() => {
    if (!rideInfo?.id) return;
    const unsub = onSnapshot(doc(db, "rides", rideInfo.id), (snapshot) => {
      if (snapshot.exists()) {
        setRideData(snapshot.data());
      }
    });
    return () => unsub();
  }, [rideInfo]);

  // Fetch directions for the route
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

  // Matches sendWhatsAppSos in TrackRideActivity.kt
  const handleSos = () => {
    if (!rideData || !rideInfo) return;
    const locUrl = `https://www.google.com/maps?q=${rideData.pickupLat},${rideData.pickupLng}`;
    const msg = `🚨 *EMERGENCY SOS* 🚨\nI need help on my ride!\n\n👤 *Driver:* ${rideInfo.driverName}\n🚕 *Vehicle:* ${rideInfo.vehicleSubtitle || 'Registered Vehicle'}\n📍 *Loc:* ${locUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Matches shareLiveLocation in TrackRideActivity.kt
  const handleShare = () => {
    if (!rideData) return;
    const msg = `I'm on a ride with ${rideInfo?.driverName}. Track me: https://www.google.com/maps?q=${rideData.pickupLat},${rideData.pickupLng}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCall = () => {
    if (rideData?.driverPhone) window.open(`tel:${rideData.driverPhone}`);
    else alert("Driver phone not available");
  };

  if (!rideInfo) return null;

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0 bg-black z-[70] flex flex-col">
      <div className="relative h-full flex flex-col">
        <div className="absolute inset-0 bg-[#121212]">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={rideData ? { lat: rideData.pickupLat, lng: rideData.pickupLng } : defaultCenter}
              zoom={15}
              onLoad={setMap}
              options={{ disableDefaultUI: true, styles: androidMapStyle }}
            >
              {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#FFD500', strokeWeight: 5 } }} />}
              {rideData && (
                <MarkerF
                  position={{ lat: rideData.pickupLat, lng: rideData.pickupLng }}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: "#FFD500", fillOpacity: 1, strokeWeight: 1, strokeColor: "#000", scale: 2, anchor: new google.maps.Point(12, 22),
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#FFD500]" /></div>
          )}
        </div>

        {/* Overlays */}
        <div className="absolute top-4 left-4 z-20">
          <button onClick={onClose} className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/5"><ArrowLeft className="text-white w-6 h-6" /></button>
        </div>

        <div className="absolute top-4 left-20 right-16 z-20">
          <Card radius="3xl" className="bg-[#1A1A1A] p-1.5 shadow-2xl border border-white/5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-3 p-1">
              <div className="w-11 h-11 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {rideInfo.driverPhoto ? <img src={rideInfo.driverPhoto} alt={rideInfo.driverName} className="w-full h-full object-cover" /> : <User className="text-black w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{rideInfo.driverName}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FFD500] fill-[#FFD500]" />
                  <span className="text-[10px] text-[#FFD500] font-bold">4.9</span>
                  <span className="text-[10px] text-[#B3FFFFFF] truncate ml-1">{rideInfo.vehicleSubtitle || 'Verified Vehicle'}</span>
                </div>
              </div>
              <button onClick={handleCall} className="w-11 h-11 bg-[#FFD500] rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"><Phone className="text-black w-5 h-5" /></button>
            </div>
            <AnimatePresence>{expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="p-2 pt-0"><button className="w-full h-11 bg-white/10 rounded-full flex items-center justify-center gap-2 active:bg-white/20 transition-colors"><MessageSquare className="text-white w-4 h-4" /><span className="text-xs font-bold text-white">Message Driver</span></button></div></motion.div>}</AnimatePresence>
          </Card>
        </div>

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          <button onClick={handleSos} className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/5 active:scale-90 transition-transform"><AlertTriangle className="text-[#FF5252] w-6 h-6" /></button>
          <button className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/5 active:scale-90 transition-transform"><Camera className="text-white w-6 h-6" /></button>
          <button onClick={handleShare} className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/5 active:scale-90 transition-transform"><Share2 className="text-white w-6 h-6" /></button>
          <button className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/5 active:scale-90 transition-transform"><Navigation className="text-[#FFD500] w-6 h-6" /></button>
        </div>

        <div className="mt-auto bg-black rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 z-30">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-1">{rideData?.status ? rideData.status.replace("_", " ").toUpperCase() : 'In Progress'}</h2>
          <p className="text-[#80FFFFFF] text-base mb-6">{rideData?.vehicleMake} {rideData?.vehicleModel} • {rideData?.registrationNumber}</p>
          <Button variant="ghost" className="w-full text-[#FF5252] border border-white/10 !h-14 font-bold">Cancel Ride</Button>
        </div>
      </div>
    </motion.div>
  );
}
