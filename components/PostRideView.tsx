'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Search,
  Compass,
  User,
  Calendar,
  Clock,
  Loader2,
  Edit2,
  CheckCircle2,
  Info,
  ShieldCheck,
  Navigation,
  Sparkles,
  X
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import TimePickerDialog from './ui/TimePickerDialog';
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

const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121212" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
  ]
};

export default function PostRideView({ onClose }: PostRideViewProps) {
  const [currentStep, setCurrentStep] = useState<Step>('MAP_PICKUP');
  const [loading, setLoading] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [pickup, setPickup] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [dropoff, setDropoff] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [tempAddress, setTempAddress] = useState('Locating address...');

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState(0);

  const [formData, setFormData] = useState({
    seats: 4,
    price: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
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
    } catch (error) {
        console.error(error);
        alert("Error posting ride");
    } finally {
        setLoading(false);
    }
  };

  if (!isLoaded) return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-[#FFD500]" />
      <p className="text-[#FFD500] font-bold text-sm tracking-widest uppercase">Initializing Maps</p>
    </div>
  );

  const getProgress = () => {
    if (currentStep === 'MAP_PICKUP') return 25;
    if (currentStep === 'MAP_DROPOFF') return 50;
    if (currentStep === 'MAP_ROUTE_PREVIEW') return 75;
    return 100;
  };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black z-[60] flex flex-col">
      {/* Header */}
      <div className="bg-black z-20">
        <div className="px-2 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 'MAP_PICKUP') onClose();
              else if (currentStep === 'MAP_DROPOFF') setCurrentStep('MAP_PICKUP');
              else if (currentStep === 'MAP_ROUTE_PREVIEW') setCurrentStep('MAP_DROPOFF');
              else setCurrentStep('MAP_ROUTE_PREVIEW');
            }}
            className="w-12 h-12 flex items-center justify-center active:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="text-white w-6 h-6 rotate-180" />
          </button>

          <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-12">
            {currentStep === 'RIDE_DETAILS' ? 'Post a Ride' : 'Select Location'}
          </h2>
        </div>

        <div className="w-full h-1 bg-[#212121]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            className="h-full bg-[#FFD500]"
          />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {currentStep !== 'RIDE_DETAILS' ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-[#121212]">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={lahore}
                zoom={13}
                onLoad={map => { mapRef.current = map; }}
                onIdle={onCameraIdle}
                onDragStart={() => setIsPanning(true)}
                options={mapOptions}
              >
                {currentStep === 'MAP_ROUTE_PREVIEW' && directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: '#FFD500',
                        strokeWeight: 6,
                        strokeOpacity: 0.9
                      },
                      markerOptions: { visible: true }
                    }}
                  />
                )}
              </GoogleMap>
            </div>

            {currentStep !== 'MAP_ROUTE_PREVIEW' && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none mb-6">
                <motion.div
                  animate={{
                    y: isPanning ? -25 : (isResolvingAddress ? -8 : 0),
                    scale: isPanning ? 1.2 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <MapPin className={`w-12 h-12 ${currentStep === 'MAP_PICKUP' ? 'text-[#FFD500]' : 'text-[#E46767]'}`} fill="currentColor" />
                  <motion.div
                    animate={{ scaleX: isPanning ? 0.5 : 1, opacity: isPanning ? 0.2 : 0.5 }}
                    className="w-5 h-2.5 bg-black rounded-full blur-[2px] mt-1"
                  />
                </motion.div>
              </div>
            )}

            {currentStep !== 'MAP_ROUTE_PREVIEW' && (
              <div className="absolute top-[50px] left-5 right-5 z-20">
                <div className="h-[56px] bg-[#2A2A2A] border border-[#444444] rounded-[28px] px-5 flex items-center gap-3 shadow-lg focus-within:border-[#FFD500] transition-all">
                  <Search className="w-5 h-5 text-[#FFD500]" />
                  <Autocomplete
                    onLoad={autocomplete => { autocompleteRef.current = autocomplete; }}
                    onPlaceChanged={() => {
                      const place = autocompleteRef.current?.getPlace();
                      if (place?.geometry?.location) {
                          mapRef.current?.panTo(place.geometry.location);
                          mapRef.current?.setZoom(16);
                      }
                    }}
                    options={{ componentRestrictions: { country: 'pk' } }}
                    className="flex-1"
                  >
                    <input
                      placeholder={currentStep === 'MAP_PICKUP' ? "Search pickup point" : "Search destination"}
                      className="bg-transparent outline-none text-[16px] w-full text-white placeholder:text-[#99FFFFFF]"
                    />
                  </Autocomplete>
                </div>
              </div>
            )}

            <div className="absolute bottom-[100px] left-5 right-5 z-10">
              <div className="px-5 py-3 shadow-xl border border-[#333333] flex items-center gap-4 bg-[#212121] rounded-[16px] min-h-[48px] justify-center text-center">
                {isResolvingAddress ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#FFD500]" />
                ) : (
                  <p className="text-[13px] text-white truncate max-w-full font-medium">
                    {tempAddress}
                  </p>
                )}
              </div>
            </div>

            <div className="absolute bottom-[165px] right-4 z-10">
              <button
                onClick={handleMyLocation}
                className="w-[50px] h-[50px] bg-[#212121] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <Compass className="text-white w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-6 left-5 right-5 z-10">
              <Button
                onClick={handleConfirmLocation}
                disabled={isResolvingAddress}
                className="android-btn-primary !h-[60px]"
              >
                {currentStep === 'MAP_PICKUP' ? 'Confirm Pickup Point' :
                 currentStep === 'MAP_DROPOFF' ? 'Confirm Target' : 'Set Ride Details'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-black flex flex-col no-scrollbar">
            <div className="p-4 pt-2 space-y-6 pb-24">

              <div className="flex gap-4 p-2">
                <div className="flex flex-col items-center py-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
                  <div className="w-px flex-1 bg-white/30 my-1" />
                  <div className="w-2 h-2 rounded-full bg-[#E46767]" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[12px] font-bold text-[#666666] uppercase tracking-widest">Source</p>
                    <p className="text-white font-bold text-[15px] leading-tight line-clamp-1">{pickup?.address}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-bold text-[#666666] uppercase tracking-widest">Destination</p>
                    <p className="text-white font-bold text-[15px] leading-tight line-clamp-1">{dropoff?.address}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentStep('MAP_PICKUP')} className="w-10 h-10 flex items-center justify-center text-[#FFD500] active:scale-90">
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              <div className="android-card p-5 flex items-center gap-4 border border-white/[0.03]">
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#FFD500]" />
                </div>
                <span className="text-white font-black text-[15px] uppercase tracking-tight">Distance: {distance.toFixed(1)} km</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-android">Seats</label>
                  <div className="android-input-container !bg-[#1A1A1A] !border-none !py-4 h-[60px]">
                    <User className="w-5 h-5 text-[#666666]" />
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})}
                      className="android-input font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-android">Price</label>
                  <div className="android-input-container !bg-[#1A1A1A] !border-none !py-4 h-[60px]">
                    <span className="text-[#666666] font-black text-sm">RS</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="android-input font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-android">Date</label>
                  <div className="android-input-container !bg-[#1A1A1A] !border-none !py-4 h-[60px]">
                    <Calendar className="w-5 h-5 text-[#666666]" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="android-input font-bold !text-[14px]"
                    />
                  </div>
                </div>
                <div className="space-y-2" onClick={() => setShowTimePicker(true)}>
                  <label className="label-android">Time</label>
                  <div className="android-input-container !bg-[#1A1A1A] !border-none !py-4 h-[60px] cursor-pointer active:bg-white/5 transition-colors">
                    <Clock className="w-5 h-5 text-[#666666]" />
                    <span className="android-input font-bold flex items-center">{formData.time}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-android">Additional Notes</label>
                <div className="android-input-container !bg-[#1A1A1A] !border-none !py-4 h-[120px] items-start">
                  <textarea
                    placeholder="E.G. NO SMOKING, AC ON..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="android-input h-full resize-none py-1 font-bold uppercase placeholder:text-[#333333]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handlePublish}
                  loading={loading}
                  className="android-btn-primary !h-[72px] !rounded-full font-black uppercase tracking-widest italic shadow-xl shadow-[#FFD500]/10"
                >
                  Publish Ride
                </Button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Time Picker Dialog */}
      <TimePickerDialog
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        initialTime={formData.time}
        onConfirm={(time) => setFormData({ ...formData, time })}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
          >
            <div className="bg-[#212121] rounded-[32px] p-10 flex flex-col items-center gap-6 shadow-2xl border border-white/5">
              <Loader2 className="w-12 h-12 animate-spin text-[#FFD500]" />
              <div className="text-center space-y-2">
                <p className="text-xl font-black text-white italic uppercase tracking-tight leading-none">Publishing Ride</p>
                <p className="text-sm text-[#666666] font-medium">Securing journey protocol...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
