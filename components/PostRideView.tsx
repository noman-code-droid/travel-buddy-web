'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Search,
  X,
  Compass,
  User,
  Calendar,
  Clock,
  Bot,
  Loader2,
  Navigation,
  Check,
  Car
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import { CarpoolFinanceManager } from '@/lib/finance';

interface PostRideViewProps {
  onClose: () => void;
}

type Step = 'MAP_PICKUP' | 'MAP_DROPOFF' | 'MAP_ROUTE_PREVIEW' | 'RIDE_DETAILS';

const mapContainerStyle = { width: '100%', height: '100%' };
const lahore = { lat: 31.5204, lng: 74.3587 };

export default function PostRideView({ onClose }: PostRideViewProps) {
  const [currentStep, setCurrentStep] = useState<Step>('MAP_PICKUP');
  const [loading, setLoading] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const [pickup, setPickup] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [dropoff, setDropoff] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [tempAddress, setTempAddress] = useState('Locating address...');

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

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const resolveAddress = useCallback((lat: number, lng: number) => {
    if (!window.google) return;
    setIsResolvingAddress(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setTempAddress(results[0].formatted_address);
      } else {
        setTempAddress("Point on Map");
      }
      setIsResolvingAddress(false);
    });
  }, []);

  const onCameraIdle = useCallback(() => {
    if (!mapRef.current || currentStep === 'MAP_ROUTE_PREVIEW' || currentStep === 'RIDE_DETAILS') return;
    const center = mapRef.current.getCenter();
    if (center) {
      resolveAddress(center.lat(), center.lng());
    }
    setIsPanning(false);
  }, [currentStep, resolveAddress]);

  const handleConfirmLocation = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;

    const loc = { lat: center.lat(), lng: center.lng(), address: tempAddress };

    if (currentStep === 'MAP_PICKUP') {
      setPickup(loc);
      setCurrentStep('MAP_DROPOFF');
    } else {
      setDropoff(loc);
      setCurrentStep('MAP_ROUTE_PREVIEW');
    }
  };

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
          const suggested = CarpoolFinanceManager.calculateSuggestedPrice(dist, formData.seats);
          setFormData(prev => ({ ...prev, price: suggested.toString() }));
        }
      }
    );
  }, [pickup, dropoff, formData.seats]);

  useEffect(() => {
    if (currentStep === 'MAP_ROUTE_PREVIEW') calculateRoute();
  }, [currentStep, calculateRoute]);

  const onPlaceSelected = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        mapRef.current?.panTo(place.geometry.location);
        mapRef.current?.setZoom(16);
      }
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(16);
      });
    }
  };

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
    } catch (error) { alert("Error posting ride"); }
    finally { setLoading(false); }
  };

  if (!isLoaded) return <div className="absolute inset-0 bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFD500]" /></div>;

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black z-[60] flex flex-col">
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
          <div className="relative w-full h-full">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={lahore}
              zoom={13}
              onLoad={map => { mapRef.current = map; }}
              onIdle={onCameraIdle}
              onDragStart={() => setIsPanning(true)}
              options={{
                disableDefaultUI: false,
                gestureHandling: 'greedy'
              }}
            >
              {currentStep === 'MAP_ROUTE_PREVIEW' && directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    polylineOptions: { strokeColor: '#FFD500', strokeWeight: 6 },
                    markerOptions: { visible: true }
                  }}
                />
              )}
            </GoogleMap>

            {/* FIXED CENTER PIN */}
            {currentStep !== 'MAP_ROUTE_PREVIEW' && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none mb-1">
                <motion.div
                  animate={{
                    y: isPanning ? -25 : (isResolvingAddress ? -8 : 0),
                    scale: isPanning ? 1.2 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <MapPin className={`w-12 h-12 ${currentStep === 'MAP_PICKUP' ? 'text-[#FFD500]' : 'text-[#E46767]'}`} />
                  <motion.div
                    animate={{
                      scaleX: isPanning ? 0.5 : 1,
                      opacity: isPanning ? 0.2 : 0.5
                    }}
                    className="w-3 h-1.5 bg-black rounded-full blur-[1px] mt-[-2px]"
                  />
                </motion.div>
              </div>
            )}

            {/* Search Overlay */}
            {currentStep !== 'MAP_ROUTE_PREVIEW' && (
              <div className="absolute top-4 left-4 right-4 z-20">
                <Autocomplete
                  onLoad={autocomplete => { autocompleteRef.current = autocomplete; }}
                  onPlaceChanged={onPlaceSelected}
                  options={{ componentRestrictions: { country: 'pk' } }}
                >
                  <Card variant="flat" radius="2xl" className="p-4 flex items-center gap-3 shadow-2xl bg-[#1A1A1A] border-white/5">
                    <Search className="w-5 h-5 text-[#FFD500]" />
                    <input
                      placeholder={currentStep === 'MAP_PICKUP' ? "Search pickup point..." : "Search destination..."}
                      className="bg-transparent outline-none text-[16px] w-full text-white placeholder:text-[#666666]"
                    />
                  </Card>
                </Autocomplete>
              </div>
            )}

            {/* Address Pill */}
            <div className="absolute bottom-24 left-4 right-4 z-10">
              <Card variant="flat" radius="xl" className="p-4 text-center text-sm font-bold shadow-2xl border border-white/10 flex items-center justify-center gap-3 bg-[#1A1A1A]">
                {isResolvingAddress && <Loader2 className="w-4 h-4 animate-spin text-[#FFD500]" />}
                <span className={isResolvingAddress ? 'opacity-50' : 'text-white'}>{tempAddress}</span>
              </Card>
            </div>

            {/* My Location Button */}
            <div className="absolute bottom-40 right-4 z-10">
              <button
                onClick={handleMyLocation}
                className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg border border-white/10 active:scale-90 transition-transform"
              >
                <Compass className="text-white w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-6 left-4 right-4 z-10">
              <Button onClick={handleConfirmLocation} disabled={isResolvingAddress}>
                {currentStep === 'MAP_PICKUP' ? 'Confirm Pickup Point' :
                 currentStep === 'MAP_DROPOFF' ? 'Confirm Drop-off' : 'Set Ride Details'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto h-full pb-32">
             <Card variant="flat" className="p-5 space-y-4 border border-white/5 bg-[#1A1A1A]">
                <div className="flex gap-4">
                   <div className="flex flex-col items-center py-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFD500]" />
                      <div className="w-px flex-1 bg-[#333333] my-1" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E46767]" />
                   </div>
                   <div className="flex-1 text-sm space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#666666] uppercase">Pickup</p>
                        <p className="text-white font-medium truncate">{pickup?.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#666666] uppercase">Destination</p>
                        <p className="text-white font-medium truncate">{dropoff?.address}</p>
                      </div>
                   </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <span className="text-xs font-black text-[#FFD500] tracking-widest uppercase">Distance: {distance.toFixed(1)} km</span>
                </div>
             </Card>

             <div className="grid grid-cols-2 gap-4">
                <Input label="Seats" type="number" value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})} icon={<User className="w-4 h-4" />} />
                <Input label="Price (RS)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} icon={<span className="text-xs font-bold">PKR</span>} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="invert opacity-60" icon={<Calendar className="w-4 h-4" />} />
                <Input label="Time" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="invert opacity-60" icon={<Clock className="w-4 h-4" />} />
             </div>
             <Card variant="flat" className="p-4 bg-[#FFD50010] border-[#FFD50030]">
                <div className="flex gap-3">
                   <Bot className="text-[#FFD500] w-5 h-5 shrink-0" />
                   <p className="text-[11px] text-[#FFD500] leading-relaxed">
                     AI Estimate: Based on vehicle distance ({distance.toFixed(1)}km), we suggest **PKR {CarpoolFinanceManager.calculateSuggestedPrice(distance, formData.seats)}**.
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
