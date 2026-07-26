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
  Sparkles
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
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

  const [pickup, setPickup] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [dropoff, setDropoff] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [tempAddress, setTempAddress] = useState('Locating address...');

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState(0);

  const [formData, setFormData] = useState({
    seats: 4,
    price: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
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

  if (!isLoaded) return <div className="absolute inset-0 bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFD500]" /></div>;

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black z-[60] flex flex-col">
      {/* Dynamic Header */}
      <div className="p-8 pb-4 flex items-center gap-6 z-20 bg-black">
        <button onClick={() => {
          if (currentStep === 'MAP_PICKUP') onClose();
          else if (currentStep === 'MAP_DROPOFF') setCurrentStep('MAP_PICKUP');
          else if (currentStep === 'MAP_ROUTE_PREVIEW') setCurrentStep('MAP_DROPOFF');
          else setCurrentStep('MAP_ROUTE_PREVIEW');
        }} className="p-4 bg-[#1A1A1A] rounded-[20px] active:scale-90 transition-transform border border-[#2A2A2A]">
          <ArrowLeft className="text-white w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-[24px] font-black text-white italic uppercase tracking-tighter leading-none">
            {currentStep === 'MAP_PICKUP' && 'Set Pickup'}
            {currentStep === 'MAP_DROPOFF' && 'Set Destination'}
            {currentStep === 'MAP_ROUTE_PREVIEW' && 'Preview Route'}
            {currentStep === 'RIDE_DETAILS' && 'Ride Specs'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                  (i === 1 && currentStep === 'MAP_PICKUP') ||
                  (i === 2 && currentStep === 'MAP_DROPOFF') ||
                  (i === 3 && currentStep === 'MAP_ROUTE_PREVIEW') ||
                  (i === 4 && currentStep === 'RIDE_DETAILS')
                  ? 'w-8 bg-[#FFD500]' : 'w-2.5 bg-[#2A2A2A]'
                }`} />
              ))}
            </div>
            <span className="text-[10px] text-[#666666] font-black uppercase tracking-[0.2em] ml-2">Phase 0{
              currentStep === 'MAP_PICKUP' ? '1' : currentStep === 'MAP_DROPOFF' ? '2' : currentStep === 'MAP_ROUTE_PREVIEW' ? '3' : '4'
            }</span>
          </div>
        </div>
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

            {/* Aggressive Pin Design */}
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
                  <div className={`p-5 rounded-[24px] ${currentStep === 'MAP_PICKUP' ? 'bg-[#FFD500]' : 'bg-[#E46767]'} shadow-2xl shadow-black/80`}>
                    <MapPin className="w-8 h-8 text-black" />
                  </div>
                  <motion.div
                    animate={{ scaleX: isPanning ? 0.5 : 1, opacity: isPanning ? 0.2 : 0.5 }}
                    className="w-5 h-2.5 bg-black rounded-full blur-[2px] mt-1"
                  />
                </motion.div>
              </div>
            )}

            {/* Search Overlay */}
            {currentStep !== 'MAP_ROUTE_PREVIEW' && (
              <div className="absolute top-6 left-6 right-6 z-20">
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
                >
                  <div className="bg-[#1A1A1A]/95 backdrop-blur-xl border border-[#2A2A2A] rounded-[24px] px-6 py-5 flex items-center gap-5 shadow-2xl focus-within:border-[#FFD500] transition-all">
                    <Search className="w-6 h-6 text-[#FFD500]" />
                    <input
                      placeholder={currentStep === 'MAP_PICKUP' ? "SEARCH PICKUP LOCATION" : "SEARCH DESTINATION"}
                      className="bg-transparent outline-none text-[16px] w-full text-white placeholder:text-[#444444] font-black uppercase tracking-tight"
                    />
                  </div>
                </Autocomplete>
              </div>
            )}

            {/* Address Pill */}
            <div className="absolute bottom-36 left-8 right-8 z-10">
              <div className="p-6 shadow-2xl border border-white/5 flex items-center gap-5 bg-[#1A1A1A]/95 backdrop-blur-xl rounded-[28px]">
                <div className={`w-14 h-14 ${currentStep === 'MAP_PICKUP' ? 'bg-[#FFD500]' : 'bg-[#E46767]'} rounded-2xl flex items-center justify-center shrink-0`}>
                    {isResolvingAddress ? (
                        <Loader2 className="w-7 h-7 animate-spin text-black" />
                    ) : (
                        <MapPin className="w-7 h-7 text-black" />
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] font-black text-[#666666] uppercase tracking-[0.2em] mb-1">
                        {currentStep === 'MAP_PICKUP' ? 'PICKUP POINT' : 'TARGET POINT'}
                    </p>
                    <p className={`text-[15px] font-black uppercase tracking-tight truncate ${isResolvingAddress ? 'text-[#444444]' : 'text-white'}`}>
                        {tempAddress}
                    </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-64 right-8 z-10">
              <button
                onClick={handleMyLocation}
                className="w-16 h-16 bg-[#1A1A1A] rounded-[24px] flex items-center justify-center shadow-2xl border border-[#2A2A2A] active:scale-90 transition-transform"
              >
                <Compass className="text-[#FFD500] w-8 h-8" />
              </button>
            </div>

            <div className="absolute bottom-10 left-8 right-8 z-10">
              <Button onClick={handleConfirmLocation} disabled={isResolvingAddress} className="!h-[80px] !rounded-full font-black uppercase tracking-[0.15em] text-[20px] shadow-2xl active:scale-[0.98]">
                {currentStep === 'MAP_PICKUP' ? 'CONFIRM PICKUP' :
                 currentStep === 'MAP_DROPOFF' ? 'CONFIRM TARGET' : 'CONTINUE'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-12 overflow-y-auto h-full pb-44 bg-black">
             <div className="flex flex-col items-center mt-6 mb-10">
                <div className="w-[90px] h-[90px] bg-[#FFD500] rounded-[28px] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(255,213,0,0.2)]">
                  <Navigation className="text-black w-[48px] h-[48px]" />
                </div>
                <h2 className="text-[32px] font-black text-white italic uppercase tracking-tighter text-center leading-[0.85]">
                  FINALIZE JOURNEY
                </h2>
                <p className="text-[#ABABAB] text-[15px] mt-6 text-center leading-relaxed max-w-[280px]">
                  Verified travel buddy protocol initialized. Confirm your ride specifications below.
                </p>
             </div>

             <div className="space-y-6">
                <h3 className="text-[12px] font-black text-[#444444] uppercase tracking-[0.3em] ml-1">ROUTE SPECIFICATIONS</h3>
                <div className="p-8 space-y-10 border border-white/[0.03] bg-[#1A1A1A] rounded-[32px] shadow-2xl">
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center py-2">
                          <div className="w-5 h-5 rounded-full bg-[#FFD500] shadow-[0_0_20px_rgba(255,213,0,0.5)]" />
                          <div className="w-[2px] flex-1 bg-[#2A2A2A] my-4" />
                          <div className="w-5 h-5 rounded-full bg-[#E46767] shadow-[0_0_20px_rgba(228,103,103,0.5)]" />
                      </div>
                      <div className="flex-1 space-y-10">
                          <div className="w-full text-left">
                              <p className="text-[11px] font-black text-[#666666] uppercase tracking-[0.2em] mb-1.5">STARTING POINT</p>
                              <p className="text-white font-black text-[15px] uppercase tracking-tight leading-tight line-clamp-2">{pickup?.address}</p>
                          </div>
                          <div className="w-full text-left">
                              <p className="text-[11px] font-black text-[#666666] uppercase tracking-[0.2em] mb-1.5">END POINT</p>
                              <p className="text-white font-black text-[15px] uppercase tracking-tight leading-tight line-clamp-2">{dropoff?.address}</p>
                          </div>
                      </div>
                      <button onClick={() => setCurrentStep('MAP_PICKUP')} className="w-14 h-14 bg-[#2A2A2A] rounded-2xl flex items-center justify-center active:scale-90 transition-transform shrink-0">
                        <Edit2 className="w-6 h-6 text-[#FFD500]" />
                      </button>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                           <div className="px-4 py-2 bg-[#FFD50010] rounded-xl border border-[#FFD50020]">
                               <span className="text-[11px] font-black text-[#FFD500] uppercase tracking-[0.1em]">TOTAL RANGE</span>
                           </div>
                           <span className="text-2xl font-black text-white italic tracking-tighter">{distance.toFixed(1)} KM</span>
                       </div>
                    </div>
                </div>
             </div>

             <div className="space-y-8">
                <h3 className="text-[12px] font-black text-[#444444] uppercase tracking-[0.3em] ml-1">JOURNEY CONFIGURATION</h3>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[#666666] uppercase tracking-widest ml-1">CAPACITY</label>
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] px-6 py-5 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
                            <User className="w-6 h-6 text-[#666666]" />
                            <input
                                type="number"
                                value={formData.seats}
                                onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})}
                                className="bg-transparent outline-none text-white text-[18px] w-full font-black"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[#666666] uppercase tracking-widest ml-1">FARE (PKR)</label>
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] px-6 py-5 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
                            <span className="text-[14px] font-black text-[#666666]">RS</span>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                className="bg-transparent outline-none text-white text-[18px] w-full font-black"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[#666666] uppercase tracking-widest ml-1">DATE</label>
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] px-6 py-5 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
                            <Calendar className="w-6 h-6 text-[#666666]" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="bg-transparent outline-none text-white text-[14px] w-full font-black uppercase"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[#666666] uppercase tracking-widest ml-1">DEPARTURE</label>
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] px-6 py-5 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
                            <Clock className="w-6 h-6 text-[#666666]" />
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                                className="bg-transparent outline-none text-white text-[18px] w-full font-black"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#666666] uppercase tracking-widest ml-1">DRIVER NOTES</label>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] px-6 py-5 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
                        <Info className="w-6 h-6 text-[#666666]" />
                        <input
                            placeholder="E.G. NO SMOKING, AC ON"
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="bg-transparent outline-none text-white text-[16px] w-full font-black uppercase placeholder:text-[#333333]"
                        />
                    </div>
                </div>
             </div>

             <div className="bg-[#1A1A1A] p-7 rounded-[32px] border border-white/[0.03] flex gap-6 items-center">
                <div className="w-14 h-14 bg-[#22C55E10] rounded-2xl flex items-center justify-center shrink-0 border border-[#22C55E15]">
                    <ShieldCheck className="text-[#22C55E] w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <p className="text-[15px] text-white font-black uppercase tracking-tight">IDENTITY SECURED</p>
                    <p className="text-[11px] text-[#777777] leading-snug font-medium">
                        Your contact details remain encrypted until a travel buddy confirms the ride.
                    </p>
                </div>
            </div>

             <div className="fixed bottom-0 left-0 right-0 p-8 bg-black">
                <Button
                  onClick={handlePublish}
                  loading={loading}
                  className="!h-[80px] !rounded-full font-black uppercase tracking-[0.2em] text-[20px] shadow-2xl active:scale-[0.98]"
                >
                  PUBLISH RIDE
                </Button>
                <p className="text-[11px] text-[#333333] font-black uppercase tracking-[0.6em] text-center mt-6">
                  TRAVEL BUDDY RIDE PROTOCOL V2.1
                </p>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
