import { db, storage } from '../config/firebaseconfig';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Grievance } from '../types';

/**
 * Handles the full submission flow for a grievance.
 * Updates:
 * 1. Sets status to 'Routed' to trigger Cloud Function auto-assignment.
 * 2. Includes aiMeta to store confidence and routing scores.
 */
export const submitGrievance = async (
    userId: string, 
    data: Partial<Grievance>, 
    imageUri?: string,
    locationCoords?: { latitude: number; longitude: number }
) => {
    try {
        console.log("[dbService] Starting submission for user:", userId);
        
        let imageUrl = null;

        // 1. Upload Image to Firebase Storage
        if (imageUri) {
            console.log("[dbService] Uploading image...");
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const storageRef = ref(storage, `grievances/${userId}_${Date.now()}.jpg`);
            await uploadBytes(storageRef, blob);
            imageUrl = await getDownloadURL(storageRef);
            console.log("[dbService] Image URL generated:", imageUrl);
        }

        // 2. Prepare GeoPoint for Proximity Calculation
        const finalLocation = locationCoords 
            ? new GeoPoint(locationCoords.latitude, locationCoords.longitude) 
            : null;

        // 3. Prepare Final Document matching Cloud Function expectations
        const grievanceData: any = {
            userId,
            citizenName: data.citizenName || 'Anonymous',
            description: data.description || '',
            category: data.category || 'Uncategorized', // Must match Worker Department exactly
            priority: data.priority || 'Low',
            imageUrl: imageUrl || null,
            location: finalLocation,
            /**
             * CRITICAL: Changed 'Active' to 'Routed'.
             * Your Cloud Function trigger (onWrite/onUpdate) specifically checks for 
             * after.status === 'Routed' to start worker assignment.
             */
            status: 'Routed', 
            createdAt: serverTimestamp(),
            // Pass AI metadata from your FastAPI analysis
            aiMeta: (data as any).aiMeta || {
                confidence: 0,
                needs_review: true,
                all_scores: {}
            }
        };

        console.log("[dbService] Final payload sending to Firestore:", grievanceData);

        // 4. Save to Firestore
        const docRef = await addDoc(collection(db, "grievances"), grievanceData);
        console.log("[dbService] Firestore document created with ID:", docRef.id);
        
        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("[dbService] Submission failed:", error);
        return { success: false, error: error.message };
    }
};