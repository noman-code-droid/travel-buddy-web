'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Compass, Loader2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import Button from './ui/Button';
import { androidMapStyle } from '@/lib/map-style';

interface PickupSelectorViewProps {
  onClose: () => void;
  onConfirm: (location: { lat: number; lng: number; address: string }) => void;
  routeDirections: google.maps.DirectionsResult | null;
}

const mapContainerStyle = { width: '100%', height: '100%' };

export default function PickupSelectorView({ onClose, onConfirm, routeDirections }: PickupSelectorViewProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('Tap on route to select spot');
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedPoint({ lat, lng });

    setLoading(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setAddress(results[0].formatted_address);
      }
      setLoading(false);
    });
  }, []);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 bg-black z-[90] flex flex-col"
    >
      <div className="relative flex-1">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={routeDirections?.routes[0].legs[0].start_location || { lat: 31.5204, lng: 74.3587 }}
            zoom={14}
            onClick={onMapClick}
            options={{ disableDefaultUI: true, styles: androidMapStyle }}
          >
            {routeDirections && (
              <DirectionsRenderer
                directions={routeDirections}
                options={{ polylineOptions: { strokeColor: '#FFD500', strokeWeight: 5, strokeOpacity: 0.5 } }}
              />
            )}
            {selectedPoint && (
              <MarkerF position={selectedPoint} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' }} />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <Loader2 className="animate-spin text-[#FFD500]" />
          </div>
        )}

        {/* Header Overlay - Matches layout_pickup_selector.xml */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 z-20">
          <button onClick={onClose} className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <ArrowLeft className="text-white w-6 h-6 rotate-180" />
          </button>
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-xl">
             <p className="text-white font-bold text-sm tracking-tight">Select Pickup on Route</p>
          </div>
        </div>

        {/* Address Pill */}
        <div className="absolute bottom-36 left-6 right-6 z-20">
          <div className="bg-[#212121] p-4 rounded-2xl border border-white/5 shadow-2xl flex items-center gap-4">
             <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center shrink-0">
               {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#FFD500]" /> : <MapPin className="text-[#FFD500] w-5 h-5" />}
             </div>
             <p className="text-[13px] text-white font-medium truncate">{address}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="absolute bottom-8 left-6 right-6 z-20">
          <Button
            onClick={() => selectedPoint && onConfirm({ ...selectedPoint, address })}
            disabled={!selectedPoint || loading}
            className="android-btn-primary !h-[64px] !rounded-full shadow-2xl shadow-[#FFD500]/20"
          >
            Confirm Pickup Spot
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
