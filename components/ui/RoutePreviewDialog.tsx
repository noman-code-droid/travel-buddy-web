'use client';

import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Dialog from './Dialog';

interface RoutePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

const mapContainerStyle = { width: '100%', height: '400px' };
const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] }
  ]
};

export default function RoutePreviewDialog({ isOpen, onClose, pickup, dropoff }: RoutePreviewDialogProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (isOpen && isLoaded && pickup && dropoff) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup,
          destination: dropoff,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
          }
        }
      );
    }
  }, [isOpen, isLoaded, pickup, dropoff]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[360px] !p-1"
      showClose={false}
    >
      <div className="flex flex-col">
        {/* Handle - Matches Android dialog_route_preview.xml */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />

        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-[16px] font-bold text-white tracking-tight">Route Map</h3>
          <button onClick={onClose} className="p-2 text-[#666666] active:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-3 mb-4 rounded-[20px] overflow-hidden bg-[#121212] border border-white/5 relative">
          {!isLoaded ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFD500]" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={pickup}
              zoom={12}
              options={mapOptions}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    polylineOptions: {
                      strokeColor: '#FFD500',
                      strokeWeight: 5,
                      strokeOpacity: 0.9
                    }
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>

        <div className="flex flex-col items-center pb-6">
          <p className="text-[11px] text-[#666666] font-medium tracking-tight">
            Pinch to zoom • Drag to explore
          </p>
        </div>
      </div>
    </Dialog>
  );
}
