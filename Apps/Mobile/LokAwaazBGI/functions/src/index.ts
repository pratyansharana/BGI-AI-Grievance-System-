import * as functions from 'firebase-functions/v1'; 
import * as admin from 'firebase-admin';

admin.initializeApp();

/** * Interface updated to match your exact Firestore fields:
 * - duty_status is boolean
 * - location is the geopoint field
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const autoAssignGrievance = functions.firestore
    .document('grievances/{reportId}')
    .onUpdate(async (change) => {
        const after = change.after.data();
        const before = change.before.data();
        const reportId = change.after.id;

        if (!after || !before) return null;

        // Trigger when status changes to 'Routed'
        if (after.status === 'Routed' && before.status !== 'Routed') {
            const { category, location: grievanceLoc, userId } = after;

            try {
                // Querying based on your 'Road Maintenance' style departments
                const staffQuery = await admin.firestore().collection('field_staff')
                    .where('department', '==', category)
                    .where('duty_status', '==', true) // true = Available in your schema
                    .get();

                if (staffQuery.empty) {
                    console.log(`No workers available for department: ${category}`);
                    return null;
                }

                let nearestWorker: Worker | null = null;
                let shortestDistance = Infinity;

                staffQuery.forEach(doc => {
                    const workerData = doc.data() as Worker;
                    // Using your 'location' field name
                    const distance = calculateDistance(
                        grievanceLoc.latitude, grievanceLoc.longitude,
                        workerData.location.latitude, workerData.location.longitude
                    );

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestWorker = { fsid: doc.id, ...workerData };
                    }
                });

                if (nearestWorker) {
                    const batch = admin.firestore().batch();

                    // Update Grievance
                    batch.update(admin.firestore().collection('grievances').doc(reportId), {
                        workerId: nearestWorker.fsid,
                        workerName: nearestWorker.name,
                        status: 'In Progress',
                        assignedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Update Worker: set duty_status to false (Busy)
                    batch.update(admin.firestore().collection('field_staff').doc(nearestWorker.fsid), {
                        duty_status: false,
                        assignedTask: reportId,
                        lastUpdated: Date.now()
                    });

                    await batch.commit();
                    console.log(`Assigned ${reportId} to ${nearestWorker.name}`);
                    
                    await notifyParties(userId, nearestWorker, category);
                }
            } catch (err) {
                console.error("Assignment Error:", err);
            }
        }
        return null;
    });

async function notifyParties(userId: string, worker: Worker, category: string) {
    const messages: any[] = [];

    // Notify User
    messages.push(admin.messaging().send({
        topic: userId,
        notification: {
            title: 'Worker Dispatched! 🚀',
            body: `${worker.name} is handling your ${category} request.`
        }
    }));

    // Notify Worker
    if (worker.fcmToken) {
        messages.push(admin.messaging().send({
            token: worker.fcmToken,
            notification: {
                title: 'New Task! 📍',
                body: `New ${category} task assigned. View details in app.`
            }
        }));
    }

    return Promise.all(messages);
}