'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Search, X, Compass, User, Calendar, Clock, Bot, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

interface PostRideViewProps {
  onClose: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 31.5204, // Lahore default
  lng: 74.3587,
};

export default function PostRideView({ onClose }: PostRideViewProps) {
  const [step, setStep] = useState<'map' | 'details'>('map');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    seats: 4,
    price: '',
    date: '',
    time: '',
    notes: ''
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handlePublish = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "rides"), {
        ...formData,
        driver: auth.currentUser.displayName || 'Anonymous Driver',
        driverId: auth.currentUser.uid,
        rating: 5.0,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      console.error("Error publishing ride: ", error);
      alert("Failed to publish ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      {step === 'map' ? (
        <div className="relative h-full">
           {/* Header with Back Button */}
           <div className="absolute top-4 left-4 z-20">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10"
              >
                <ArrowLeft className="text-white w-6 h-6" />
              </button>
           </div>

           <div className="absolute inset-0 bg-[#121212]">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                  onUnmount={onUnmount}
                  options={{
                    disableDefaultUI: true,
                    styles: [
                      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    ], // Simple dark mode
                  }}
                >
                  <MarkerF position={center} icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: "#FFD500",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#000",
                    scale: 2,
                    anchor: new google.maps.Point(12, 22),
                  }} />
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
                </div>
              )}
           </div>

           <div className="absolute top-16 left-5 right-5 z-10">
              <Card variant="flat" radius="2xl" className="p-4 flex items-center gap-3 shadow-lg bg-[#2A2A2A]">
                 <Search className="w-5 h-5 text-[#FFD500]" />
                 <input
                    placeholder="Search location"
                    className="bg-transparent outline-none text-[16px] w-full text-white"
                    value={formData.pickup}
                    onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                 />
                 {formData.pickup && <X className="text-[#ABABAB] w-5 h-5 cursor-pointer" onClick={() => setFormData({...formData, pickup: ''})} />}
              </Card>
           </div>

           <div className="absolute bottom-8 left-5 right-5 space-y-4">
              <div className="flex justify-end">
                 <button className="w-[50px] h-[50px] bg-[#212121] rounded-full flex items-center justify-center shadow-lg border border-[#333333]">
                    <Compass className="text-white w-6 h-6" />
                 </button>
              </div>
              <Card variant="flat" radius="xl" className="p-4 text-center text-white text-[13px] border border-[#333333]">
                 {formData.pickup || 'Locating address...'}
              </Card>
              <Button
                onClick={() => setStep('details')}
                disabled={!formData.pickup}
                className="!h-[60px] !rounded-[28px]"
              >
                Confirm Pickup Point
              </Button>
           </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-black">
          <div className="p-4 flex items-center gap-4 border-b border-[#333333]">
            <button onClick={() => setStep('map')}><ArrowLeft className="text-white w-7 h-7" /></button>
            <h2 className="font-bold text-[20px]">Post a Ride</h2>
          </div>
          <div className="p-4 space-y-6 flex-1 overflow-y-auto pb-24">
             <div className="flex gap-4">
                <div className="flex flex-col items-center py-2">
                   <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
                   <div className="w-[1.5px] flex-1 bg-[#333333] my-1" />
                   <div className="w-2 h-2 rounded-full bg-[#E46767]" />
                </div>
                <div className="flex-1 space-y-4">
                   <div onClick={() => setStep('map')} className="cursor-pointer">
                      <span className="label-android ml-0">Source</span>
                      <p className="text-[15px] font-bold text-white mt-1">{formData.pickup || 'Select pickup location'}</p>
                   </div>
                   <div className="space-y-1">
                      <span className="label-android ml-0">Destination</span>
                      <input
                        placeholder="Enter destination"
                        className="bg-transparent border-none outline-none text-[15px] font-bold text-white w-full"
                        value={formData.dropoff}
                        onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                      />
                   </div>
                </div>
             </div>

             <Card variant="flat" className="p-4 flex items-center gap-3 border border-[#333333]">
                <MapPin className="text-[#FFD500] w-6 h-6" />
                <span className="text-[14px] font-bold">Estimated Distance: 12 km</span>
             </Card>

             <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Seats"
                  icon={<User className="w-5 h-5" />}
                  type="number"
                  placeholder="Max 4"
                  value={formData.seats}
                  onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})}
                />
                <Input
                  label="Price"
                  icon={<span className="font-bold text-[14px]">RS</span>}
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  icon={<Calendar className="w-5 h-5" />}
                  type="date"
                  className="invert opacity-60"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
                <Input
                  label="Time"
                  icon={<Clock className="w-5 h-5" />}
                  type="time"
                  className="invert opacity-60"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
             </div>

             <div>
                <label className="label-android ml-1">Additional Notes</label>
                <Card variant="flat" className="p-4 min-h-[100px] border border-[#333333]">
                   <textarea
                    placeholder="Any preferences..."
                    className="bg-transparent outline-none text-white text-[15px] w-full resize-none h-full placeholder:text-[#ABABAB]"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   />
                </Card>
             </div>

             <div className="bg-[#FFD50010] border border-[#FFD50040] rounded-[24px] p-4 flex gap-3">
                <Bot className="text-[#FFD500] w-6 h-6 shrink-0" />
                <p className="text-[11px] text-[#FFD500]">
                  AI Tip: Based on your vehicle and distance, we suggest a price of **RS 250 - 350** per seat.
                </p>
             </div>

             <Button
                onClick={handlePublish}
                loading={loading}
                disabled={!formData.dropoff || !formData.price || !formData.date}
                className="!h-[60px] !rounded-[30px] mt-4 shadow-xl shadow-[#FFD50020]"
             >
                {loading ? <Loader2 className="animate-spin" /> : "Publish Ride"}
             </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
