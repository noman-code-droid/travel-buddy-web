export type AppState = 'splash' | 'onboarding' | 'auth' | 'complete_profile' | 'main';
export type UserMode = 'passenger' | 'driver';
export type ActiveTab = 'home' | 'rides' | 'explore' | 'profile';
export type SubView = 'find' | 'post' | 'safety' | 'notifications' | 'chat_list' | 'chat_detail' | 'planner' | 'driver_reg' | 'track_ride' | 'ride_details' | 'financial' | null;

export interface UserStats {
  trips: number;
  savingsOrEarnings: number;
  rating: string;
}

export interface ActiveRideInfo {
  id: string;
  driverId: string;
  driverName: string;
  driverPhoto?: string;
  status: string;
  route: string;
  isDriver: boolean;
  vehicleSubtitle?: string;
}

export interface Ride {
  id: string;
  driver: string;
  driverId: string;
  driverPhoto?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  registrationNumber?: string;
  hasAc?: boolean;
  seats: number;
  bookedSeats: number;
  price: number | string;
  rating: number;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  dropoff: string;
  dropoffLat: number;
  dropoffLng: number;
  date: string;
  time: string;
  status: string;
  notes?: string;
}

export interface Notification {
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'info' | 'alert';
}

export interface Chat {
  id: string;
  name: string;
  otherUserId: string;
  lastMsg: string;
  time: string;
  unread: number;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  timestamp: any;
  type: 'TEXT' | 'IMAGE';
}
