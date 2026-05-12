import { Timestamp } from 'firebase/firestore';

import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface Grievance {
  id?: string;
  userId: string;
  citizenName: string;
  description: string;
  category: 'Electricity' | 'Water Supply' | 'Sanitation' | 'Roads' | 'Uncategorized';
  priority: 'Low' | 'Medium' | 'High';
  imageUrl: string | null;
  location: GeoPoint | null; // <-- Added location field
  status: 'Active' | 'Resolved' | 'Pending';
  createdAt: Timestamp | any; // Use 'any' for serverTimestamp() during creation
}

export interface AIResponse {
  category: Grievance['category'];
  priority: Grievance['priority'];
  urgency_reason: string;
  confidence_score: number;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    mobile: string;
    pushToken: string;
    location: {
        latitude: number;
        longitude: number;
    };
    joinedAt: Timestamp | any;
}