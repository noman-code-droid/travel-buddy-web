export type AppState = 'splash' | 'onboarding' | 'auth' | 'main';
export type UserMode = 'passenger' | 'driver';
export type ActiveTab = 'home' | 'rides' | 'explore' | 'profile';
export type SubView = 'find' | 'post' | 'safety' | 'notifications' | 'chat_list' | 'planner' | null;

export interface Ride {
  driver: string;
  car: string;
  seats: number;
  price: string;
  rating: number;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
}

export interface RideHistory {
  from: string;
  to: string;
  date: string;
  price: string;
  status: 'Completed' | 'Cancelled';
}

export interface Notification {
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'info' | 'alert';
}

export interface Chat {
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
}
