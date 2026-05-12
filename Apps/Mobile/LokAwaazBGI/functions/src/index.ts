import * as functions from 'firebase-functions/v1'; 
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Interface representing the Field Staff document structure in Firestore.
 */
interface Worker {
    fsid: string;
    name: string;
    department: string;
    duty_status: boolean;
    location: admin.firestore.GeoPoint;
    fcmToken?: string;
    email: string;
}

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Auto-assigns the nearest available worker when a grievance status becomes 'Routed'.
 * Uses onWrite to capture both creations and updates.
 */
export const autoAssignGrievance = functions.firestore
    .document('grievances/{reportId}')
    .onWrite(async (change, context) => {
        const after = change.after.exists ? change.after.data() : null;
        const reportId = context.params.reportId;

        // Exit if document was deleted
        if (!after) {
            console.log(`Report ${reportId} was deleted. Skipping.`);
            return null;
        }

        // Trigger logic: Process if status is 'Routed'
        if (after.status === 'Routed') {
            const { category, location: grievanceLoc, userId } = after;

            if (!grievanceLoc) {
                console.error(`Report ${reportId} missing location coordinates.`);
                return null;
            }

            try {
                console.log(`Attempting assignment for ${reportId} [Category: ${category}]`);

                // Query available workers in the specific department
                const staffQuery = await admin.firestore().collection('field_staff')
                    .where('department', '==', category)
                    .where('duty_status', '==', true) 
                    .get();

                if (staffQuery.empty) {
                    console.log(`No available workers found in department: ${category}`);
                    return null;
                }

                let nearestWorker: Worker | null = null;
                let shortestDistance = Infinity;

                staffQuery.forEach(doc => {
                    const workerData = doc.data() as Worker;
                    const distance = calculateDistance(
                        grievanceLoc.latitude, grievanceLoc.longitude,
                        workerData.location.latitude, workerData.location.longitude
                    );

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        // doc.id is used as the authoritative fsid
                        nearestWorker = { ...workerData, fsid: doc.id };
                    }
                });

                if (nearestWorker !== null) {
                    const worker: Worker = nearestWorker;
                    const batch = admin.firestore().batch();

                    console.log(`Worker Found: ${worker.name} (${shortestDistance.toFixed(2)} km away)`);

                    // 1. Update Grievance document
                    batch.update(admin.firestore().collection('grievances').doc(reportId), {
                        workerId: worker.fsid,
                        workerName: worker.name,
                        status: 'In Progress',
                        assignedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // 2. Update Worker document: set to Busy (false)
                    batch.update(admin.firestore().collection('field_staff').doc(worker.fsid), {
                        duty_status: false,
                        assignedTask: reportId,
                        lastUpdated: Date.now()
                    });

                    await batch.commit();
                    console.log(`Successfully assigned ${reportId} to ${worker.name}`);
                    
                    // 3. Dispatch Push Notifications
                    await notifyParties(userId, worker, category);
                }
            } catch (err) {
                console.error("Assignment Engine Error:", err);
            }
        }
        return null;
    });

/**
 * Sends push notifications to both the citizen and the assigned worker.
 */
async function notifyParties(userId: string, worker: Worker, category: string) {
    const messages: any[] = [];

    // Notification to Citizen
    messages.push(admin.messaging().send({
        topic: userId,
        notification: {
            title: 'Worker Dispatched! 🚀',
            body: `${worker.name} is handling your ${category} request.`
        }
    }));

    // Notification to Worker
    if (worker.fcmToken) {
        messages.push(admin.messaging().send({
            token: worker.fcmToken,
            notification: {
                title: 'New Task Assigned! 📍',
                body: `New ${category} task nearby. Tap to view details.`
            }
        }));
    }

    try {
        await Promise.all(messages);
        console.log("Notifications dispatched successfully.");
    } catch (notificationError) {
        console.error("FCM Dispatch Error:", notificationError);
    }
}