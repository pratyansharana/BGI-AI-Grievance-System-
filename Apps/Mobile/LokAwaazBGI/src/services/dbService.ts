import { db, storage } from '../config/firebaseconfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Grievance } from '../types';

export const submitGrievance = async (
    userId: string, 
    data: Partial<Grievance>, 
    imageUri?: string
) => {
    try {
        console.log("[dbService] Starting submission for user:", userId);
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

        // 2. Prepare Final Document
        const grievanceData: Omit<Grievance, 'id'> = {
            userId,
            citizenName: data.citizenName || 'Anonymous',
            description: data.description || '',
            category: data.category || 'Uncategorized',
            priority: data.priority || 'Low',
            imageUrl: imageUrl || null,
            status: 'Active',
            createdAt: serverTimestamp(),
        };

        // 3. Save to Firestore
        const docRef = await addDoc(collection(db, "grievances"), grievanceData);
        console.log("[dbService] Firestore document created with ID:", docRef.id);
        
        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("[dbService] Submission failed:", error);
        return { success: false, error: error.message };
    }
};