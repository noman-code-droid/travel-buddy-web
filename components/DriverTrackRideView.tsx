'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Navigation,
  Compass,
  Users2,
  CheckCircle2,
  Loader2,
  MessageSquare,
  User,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Phone
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { ActiveRideInfo } from '@/types';
import Button from './ui/Button';
import Card from './ui/Card';
import { androidMapStyle } from '@/lib/map-style';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';

interface DriverTrackRideViewProps {
  onClose: () => void;
  rideId: string;
}

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 31.5204, lng: 74.3587 };

export default function DriverTrackRideView({ onClose, rideId }: DriverTrackRideViewProps) {
  const [rideData, setRideData] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (!rideId) return;

    // Sync Ride Data
    const unsubRide = onSnapshot(doc(db, "rides", rideId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRideData(data);

        // Load directions if not already loaded
        if (data.pickupLat && data.dropOffLat && window.google) {
          const ds = new google.maps.DirectionsService();
          ds.route({
            origin: { lat: data.pickupLat, lng: data.pickupLng },
            destination: { lat: data.dropOffLat, lng: data.dropOffLng },
            travelMode: google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === 'OK') setDirections(result);
          });
        }
      }
    });

    // Sync Passengers
    const q = query(collection(db, "bookings"), where("rideId", "==", rideId));
    const unsubPassengers = onSnapshot(q, (snapshot) => {
      setPassengers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Live GPS Update for Driver
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await updateDoc(doc(db, "rides", rideId), {
            currentLat: latitude,
            currentLng: longitude,
            lastUpdated: serverTimestamp()
          });
        } catch (e) {}
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => {
      unsubRide();
      unsubPassengers();
      navigator.geolocation.clearWatch(watchId);
    };
  }, [rideId, isLoaded]);

  const handleAction = async () => {
    if (!rideData) return;
    setActionLoading(true);

    let nextStatus = 'started';

    if (rideData.status === 'available' || rideData.status === 'confirmed') {
      nextStatus = 'started';
    } else if (rideData.status === 'started') {
      nextStatus = 'completed';
    }

    try {
      await updateDoc(doc(db, "rides", rideId), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });

      // Update all bookings as well
      const batchPromises = passengers.map(p =>
        updateDoc(doc(db, "bookings", p.id), { status: nextStatus })
      );
      await Promise.all(batchPromises);

      if (nextStatus === 'completed') onClose();
    } catch (e) {
      alert("Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        // If we had mapRef, we'd pan here.
      });
    }
  };

  const currentPos = rideData?.currentLat ? { lat: rideData.currentLat, lng: rideData.currentLng } : defaultCenter;

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black z-[70] flex flex-col">
      <div className="relative h-full flex flex-col overflow-hidden">

        {/* Map View */}
        <div className="absolute inset-0 bg-[#121212]">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={currentPos}
              zoom={15}
              options={{ disableDefaultUI: true, styles: androidMapStyle }}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    polylineOptions: { strokeColor: '#FFD500', strokeWeight: 6 },
                    preserveViewport: true
                  }}
                />
              )}
              <MarkerF
                position={currentPos}
                icon={{
                  path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
                  fillColor: "#FFD500", fillOpacity: 1, strokeWeight: 0, scale: 1.5, anchor: new google.maps.Point(12, 12)
                }}
              />
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#FFD500]" /></div>
          )}
        </div>

        {/* Back Button - Matches activity_driver_track_ride.xml Top Left */}
        <div className="absolute top-4 left-4 z-20">
          <button onClick={onClose} className="w-11 h-11 bg-[#CC1A1A1A] backdrop-blur-md rounded-full flex items-center justify-center border border-white/5 active:scale-90 transition-transform shadow-lg">
            <ArrowLeft className="text-white w-6 h-6 rotate-180" />
          </button>
        </div>

        {/* My Location Button - Bottom Right above sheet */}
        <div className="absolute bottom-[160px] right-4 z-20">
          <button
            onClick={handleMyLocation}
            className="w-13 h-13 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/10 active:scale-90 transition-transform"
          >
            <Compass className="text-[#FFD500] w-6 h-6" />
          </button>
        </div>

        {/* Bottom Sheet - Matches activity_driver_track_ride.xml frameLayout#bottomSheet */}
        <div className="mt-auto bg-black rounded-t-[40px] p-0 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-white/10 z-30 flex flex-col max-h-[70vh]">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-6" />

          <div className="flex-1 overflow-y-auto px-8 pb-8 no-scrollbar">
            <div className="space-y-1 mb-8">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                {rideData?.status === 'started' ? 'TRIP IN PROGRESS' : 'READY TO START'}
              </h2>
              <p className="text-[14px] text-white/50 font-bold uppercase tracking-[0.2em]">
                {rideData?.vehicleMake} {rideData?.vehicleModel} • {rideData?.registrationNumber}
              </p>
            </div>

            <div className="h-px bg-white/5 w-full mb-8" />

            <div className="space-y-1 mb-6">
              <h3 className="text-[18px] font-black text-white uppercase tracking-tight italic leading-none">
                Passenger Manifest
              </h3>
              <p className="text-[12px] text-white/40 font-bold uppercase tracking-widest">
                {passengers.length} Active {passengers.length === 1 ? 'Booking' : 'Bookings'}
              </p>
            </div>

            {/* Scrollable Manifest List - Full List parity with Android */}
            <div className="space-y-3 pt-2 mb-10">
              {passengers.length === 0 ? (
                <div className="text-center py-10 opacity-30 grayscale flex flex-col items-center gap-4">
                  <Users2 className="w-10 h-10 text-white" />
                  <p className="font-black uppercase tracking-widest text-[10px] italic text-white">No Buddies Joined Yet</p>
                </div>
              ) : (
                passengers.map((p) => (
                  <div key={p.id} className="android-card p-5 border border-white/[0.03] flex items-center justify-between bg-[#1A1A1A]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#2A333C] rounded-full flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                        {p.passengerPhoto ? (
                          <img src={p.passengerPhoto} alt={p.passengerName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-[#666666] w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[16px] text-white leading-tight truncate">{p.passengerName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#666666] font-medium uppercase tracking-tighter">{p.seatsBooked} Seats</span>
                          <span className="text-[10px] text-[#22C55E] font-black uppercase tracking-widest bg-[#22C55E10] px-2 py-0.5 rounded border border-[#22C55E20]">Conf.</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center text-[#FFD500] active:scale-90 transition-transform"><MessageSquare className="w-5 h-5" /></button>
                      <a href={`tel:${p.passengerPhone || ''}`} className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center text-[#FFD500] active:scale-90 transition-transform"><Phone className="w-5 h-5" /></a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={handleAction}
              loading={actionLoading}
              className="android-btn-primary !h-[72px] !rounded-[24px] shadow-2xl shadow-[#FFD500]/10 uppercase font-black text-lg tracking-widest italic"
            >
              {rideData?.status === 'started' ? 'Finish Trip' : 'Start Trip'}
            </Button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
