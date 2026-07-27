export type AppState = 'splash' | 'onboarding' | 'auth' | 'forget_password' | 'email_verification' | 'complete_profile' | 'main';
export type UserMode = 'passenger' | 'driver';
export type ActiveTab = 'home' | 'rides' | 'explore' | 'profile';
export type SubView = 'find' | 'post' | 'safety' | 'notifications' | 'chat_list' | 'chat_detail' | 'planner' | 'driver_mgmt' | 'driver_reg' | 'track_ride' | 'ride_details' | 'financial' | 'summary' | 'global_chat' | 'settings' | 'driver_manifest' | 'driver_profile' | 'pickup_selector' | null;

export interface UserStats {
  trips: number;
  savingsOrEarnings: number;
  rating: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  gender?: string;
  dob?: string;
  photoUrl?: string;
  userType: UserMode;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  licenseUrl?: string;
  licenseBackUrl?: string;
  cnicUrl?: string;
  cnicBackUrl?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  registrationNumber?: string;
  hasAc?: boolean;
  isAdmin?: boolean;
  isDriverApplied?: boolean;
  appliedAt?: any;
  verifiedAt?: any;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  userId: string;
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
  createdAt?: any;
  dropOffLocation?: string;
  pickupLocation?: string;
  departureDate?: string;
}

export type RideHistory = Ride;

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
  photoUrl?: string;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  timestamp: any;
  type: 'TEXT' | 'IMAGE';
}
