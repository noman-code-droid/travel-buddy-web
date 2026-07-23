'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Search, X, Compass, User, Calendar, Clock, Bot, Loader2, Navigation } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { CarpoolFinanceManager } from '@/lib/finance';

interface PostRideViewProps {
  onClose: () => void;
}

// Matches Step Enum in PostRideActivity.kt
type Step = 'MAP_PICKUP' | 'MAP_DROPOFF' | 'MAP_ROUTE_PREVIEW' | 'RIDE_DETAILS';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 31.5204, lng: 74.3587 }; // Lahore

export default function PostRideView({ onClose }: PostRideViewProps) {
  const [currentStep, setCurrentStep] = useState<Step>('MAP_PICKUP');
  const [loading, setLoading] = useState(false);

  // State for map locations (matching ViewModel)
  const [pickup, setPickup] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [dropoff, setDropoff] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState(0);

  const [formData, setFormData] = useState({
    seats: 4,
    price: '',
    date: '',
    time: '',
    notes: ''
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Replicating fetchRoutes logic from PostRideViewModel.kt
  const calculateRoute = useCallback(() => {
    if (!pickup || !dropoff || !window.google) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const dist = (result.routes[0].legs[0].distance?.value || 0) / 1000;
          setDistance(dist);

          // Auto-calculate suggested price (matches recalculateSuggestion)
          const suggested = CarpoolFinanceManager.calculateSuggestedPrice(dist, formData.seats);
          setFormData(prev => ({ ...prev, price: suggested.toString() }));
        }
      }
    );
  }, [pickup, dropoff, formData.seats]);

  const handleConfirmLocation = async () => {
    if (!map) return;
    const center = map.getCenter();
    if (!center) return;

    const lat = center.lat();
    const lng = center.lng();

    // Geocoding logic (matches getAddressFromLatLng)
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const address = results[0].formatted_address;
        if (currentStep === 'MAP_PICKUP') {
          setPickup({ lat, lng, address });
          setCurrentStep('MAP_DROPOFF');
        } else {
          setDropoff({ lat, lng, address });
          setCurrentStep('MAP_ROUTE_PREVIEW');
        }
      }
    });
  };

  useEffect(() => {
    if (currentStep === 'MAP_ROUTE_PREVIEW') {
      calculateRoute();
    }
  }, [currentStep, calculateRoute]);

  const handlePublish = async () => {
    if (!auth.currentUser || !pickup || !dropoff) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "rides"), {
        driverId: auth.currentUser.uid,
        driverName: auth.currentUser.displayName || 'User',
        pickupLocation: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropOffLocation: dropoff.address,
        dropOffLat: dropoff.lat,
        dropOffLng: dropoff.lng,
        distanceKm: distance,
        ...formData,
        status: 'available',
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      alert("Error posting ride");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="absolute inset-0 bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFD500]" /></div>;

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black z-[60] flex flex-col">
      {/* Dynamic Header based on Step */}
      <div className="p-4 flex items-center gap-4 z-20 bg-black/50 backdrop-blur-md">
        <button onClick={() => {
          if (currentStep === 'MAP_PICKUP') onClose();
          else if (currentStep === 'MAP_DROPOFF') setCurrentStep('MAP_PICKUP');
          else if (currentStep === 'MAP_ROUTE_PREVIEW') setCurrentStep('MAP_DROPOFF');
          else setCurrentStep('MAP_ROUTE_PREVIEW');
        }}>
          <ArrowLeft className="text-white w-7 h-7" />
        </button>
        <h2 className="font-bold text-[18px]">
          {currentStep === 'MAP_PICKUP' && 'Select Pickup'}
          {currentStep === 'MAP_DROPOFF' && 'Select Drop-off'}
          {currentStep === 'MAP_ROUTE_PREVIEW' && 'Route Preview'}
          {currentStep === 'RIDE_DETAILS' && 'Final Details'}
        </h2>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {currentStep !== 'RIDE_DETAILS' ? (
          <>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={13}
              onLoad={setMap}
              options={{ disableDefaultUI: true, styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }] }}
            >
              {currentStep === 'MAP_ROUTE_PREVIEW' && directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{ polylineOptions: { strokeColor: '#FFD500', strokeWeight: 6 } }}
                />
              )}
              {currentStep !== 'MAP_ROUTE_PREVIEW' && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <MapPin className={`w-12 h-12 ${currentStep === 'MAP_PICKUP' ? 'text-[#FFD500]' : 'text-[#E46767]'}`} />
                </div>
              )}
            </GoogleMap>

            {/* Address Pill (Matching Android) */}
            <div className="absolute bottom-24 left-4 right-4 z-10">
              <Card variant="flat" radius="xl" className="p-4 text-center text-sm font-medium">
                {currentStep === 'MAP_PICKUP' ? (pickup?.address || 'Move map to set pickup') : (dropoff?.address || 'Move map to set destination')}
              </Card>
            </div>

            {/* Action Button (Matching Android) */}
            <div className="absolute bottom-6 left-4 right-4 z-10">
              <Button onClick={() => {
                if (currentStep === 'MAP_ROUTE_PREVIEW') setCurrentStep('RIDE_DETAILS');
                else handleConfirmLocation();
              }}>
                {currentStep === 'MAP_PICKUP' && 'Confirm Pickup Point'}
                {currentStep === 'MAP_DROPOFF' && 'Confirm Drop-off'}
                {currentStep === 'MAP_ROUTE_PREVIEW' && 'Set Ride Details'}
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto h-full pb-24">
             {/* Route Summary Card */}
             <Card variant="flat" className="p-4 space-y-4">
                <div className="flex gap-4">
                   <div className="flex flex-col items-center py-1">
                      <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
                      <div className="w-px flex-1 bg-[#333333] my-1" />
                      <div className="w-2 h-2 rounded-full bg-[#E46767]" />
                   </div>
                   <div className="flex-1 text-sm space-y-2">
                      <p className="text-[#ABABAB] truncate">{pickup?.address}</p>
                      <p className="text-[#ABABAB] truncate">{dropoff?.address}</p>
                   </div>
                </div>
                <div className="pt-2 border-t border-[#333333] flex justify-between items-center">
                   <span className="text-xs font-bold text-[#FFD500]">Distance: {distance.toFixed(1)} km</span>
                </div>
             </Card>

             <div className="grid grid-cols-2 gap-4">
                <Input label="Seats" type="number" value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})} />
                <Input label="Price (PKR)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="invert opacity-60" />
                <Input label="Time" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="invert opacity-60" />
             </div>

             <Card variant="flat" className="p-4 bg-[#FFD50010] border-[#FFD50030]">
                <div className="flex gap-3">
                   <Bot className="text-[#FFD500] w-5 h-5 shrink-0" />
                   <p className="text-[11px] text-[#FFD500] leading-relaxed">
                     Based on your vehicle and distance ({distance.toFixed(1)}km), we suggest a price of **PKR {CarpoolFinanceManager.calculateSuggestedPrice(distance, formData.seats)}**.
                   </p>
                </div>
             </Card>

             <Button onClick={handlePublish} loading={loading}>Publish Ride</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
