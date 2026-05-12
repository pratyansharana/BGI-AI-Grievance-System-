import { db, storage } from '../config/firebaseconfig';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Grievance } from '../types';

export const submitGrievance = async (
    userId: string, 
    data: Partial<Grievance>, 
    imageUri?: string,
    locationCoords?: { latitude: number; longitude: number }
) => {
    try {
        console.log("[dbService] Starting submission for user:", userId);
        
        // --- DEBUG LOG 1: Check exactly what is being passed into the function ---
        console.log("[dbService] RAW incoming locationCoords:", locationCoords);

        let imageUrl = null;

        // 1. Upload Image if exists
        if (imageUri) {
            console.log("[dbService] Uploading image...");
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const storageRef = ref(storage, `grievances/${userId}_${Date.now()}.jpg`);
            await uploadBytes(storageRef, blob);
            imageUrl = await getDownloadURL(storageRef);
            console.log("[dbService] Image URL generated:", imageUrl);
        }

        // --- DEBUG LOG 2: Check the GeoPoint conversion ---
        const finalLocation = locationCoords 
            ? new GeoPoint(locationCoords.latitude, locationCoords.longitude) 
            : null;
        console.log("[dbService] Evaluated GeoPoint location:", finalLocation);

        // 2. Prepare Final Document
        const grievanceData: Omit<Grievance, 'id'> = {
            userId,
            citizenName: data.citizenName || 'Anonymous',
            description: data.description || '',
            category: data.category || 'Uncategorized',
            priority: data.priority || 'Low',
            imageUrl: imageUrl || null,
            location: finalLocation,
            status: 'Active',
            createdAt: serverTimestamp(),
        };

        // --- DEBUG LOG 3: Inspect the exact object right before saving ---
        console.log("[dbService] Final payload sending to Firestore:", {
            ...grievanceData,
            createdAt: 'SERVER_TIMESTAMP_FIRED' // Simplified for console readability
        });

        // 3. Save to Firestore
        const docRef = await addDoc(collection(db, "grievances"), grievanceData);
        console.log("[dbService] Firestore document created with ID:", docRef.id);
        
        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("[dbService] Submission failed:", error);
        return { success: false, error: error.message };
    }
};