import { db } from '../config/firebaseconfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import { UserProfile } from '../types';

export const checkAndRegisterUser = async (uid: string): Promise<boolean> => {
    try {
        console.log(`[UserService] Checking if user ${uid} exists...`);
        const userDoc = await getDoc(doc(db, "users", uid));
        return userDoc.exists();
    } catch (error) {
        console.error("[UserService] Error in checkAndRegisterUser:", error);
        return false;
    }
};

export const saveUserProfile = async (uid: string, profile: { name: string; email: string; mobile: string }) => {
    try {
        console.log("[UserService] Starting profile save for UID:", uid);

        // --- BYPASSING NOTIFICATIONS TO PREVENT CRASH ---
        // const tokenData = await Notifications.getExpoPushTokenAsync();
        // const pushToken = tokenData.data;
        const pushToken = "NOT_INITIALIZED_YET"; 
        console.log("[UserService] Push Token bypassed for testing.");

        // Get Location
        console.log("[UserService] Requesting location...");
        const location = await Location.getCurrentPositionAsync({});
        console.log("[UserService] Location secured:", location.coords);

        const fullProfile: UserProfile = {
            uid,
            name: profile.name,
            email: profile.email,
            mobile: profile.mobile,
            pushToken,
            location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            },
            joinedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "users", uid), fullProfile);
        console.log("[UserService] Profile document successfully created in Firestore.");
        
    } catch (error) {
        console.error("[UserService] Failed to save user profile:", error);
        throw error;
    }
};