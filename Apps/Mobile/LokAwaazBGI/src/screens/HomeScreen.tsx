import React, { useEffect, useRef, useState } from 'react';
import { 
    Text, 
    View, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView,
    ScrollView,
    Animated,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { auth } from '../config/firebaseconfig';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    // Component State
    const [citizenName, setCitizenName] = useState('');
    const [complaintText, setComplaintText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    
    // Camera States
    const [permission, requestPermission] = useCameraPermissions();
    const [startCamera, setStartCamera] = useState(false);
    const cameraRef = useRef(null);

    // Active Reports and Resolved Issues
    const [activeReports] = useState([
        { id: '1', title: 'Water Pipe Leakage', category: 'Water Supply', priority: 'High' },
        { id: '2', title: 'Street Light Malfunction', category: 'Electricity', priority: 'Low' }
    ]);

    const [resolvedIssues] = useState([
        { id: '101', title: 'Pothole Repair', category: 'Roads' },
        { id: '102', title: 'Garbage Clearance', category: 'Sanitation' }
    ]);

    // Setup Entrance Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const verifyCameraPermission = async () => {
        if (!permission) {
            await requestPermission();
        }
        if (permission?.granted) {
            setStartCamera(true);
        } else {
            Alert.alert("Permission Denied", "We need camera permissions to enable this feature.");
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const options = { quality: 0.5, base64: true };
                const photo = await cameraRef.current.takePictureAsync(options);
                Alert.alert("Success", "Photo captured successfully! Attaching to complaint.");
                setStartCamera(false);
            } catch (error) {
                Alert.alert("Error", "Failed to capture picture.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!citizenName || !complaintText) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            // Simulated AI processing
            const response = await fetch('http://127.0.0.1:8000/analyze_complaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    complaint_id: `GC-${Date.now()}`,
                    citizen_name: citizenName,
                    text_content: complaintText,
                    language: "en"
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to process complaint via AI engine.");
            }

            const aiData = await response.json();
            setResult(aiData);
            Alert.alert("Success", "Complaint analyzed successfully!");
            setComplaintText('');
        } catch (error) {
            Alert.alert("Engine Offline", "Mocking analysis results as Backend is disconnected.");
            setResult({
                category: "Public Services",
                priority: "High",
                urgency_reason: "Testing Mode - Urgency detected due to missing backend server.",
            });
        } finally {
            setLoading(false);
        }
    };

    const userEmail = auth.currentUser?.email || 'Developer';
    const displayName = userEmail.split('@')[0];

    return (
        <View style={styles.mainContainer}>
            <View style={styles.bgCircleTop} />
            <View style={styles.bgCircleBottom} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.greeting}>Hello,</Text>
                                <Text style={styles.name}>{displayName}</Text>
                            </View>
                            <TouchableOpacity style={styles.profileBadge}>
                                <Text style={styles.profileBadgeText}>
                                    {displayName.charAt(0).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Stats Row (Updated to Reported vs. Resolved) */}
<View style={styles.statsRow}>
    <View style={styles.statBox}>
        <Text style={styles.statValue}>{activeReports.length}</Text>
        <Text style={styles.statLabel}>Reported Count</Text>
    </View>
    <View style={styles.statBox}>
        <Text style={styles.statValue}>{resolvedIssues.length}</Text>
        <Text style={styles.statLabel}>Resolved Count</Text>
    </View>
</View>
                    </Animated.View>

                    {/* Conditional Camera View */}
                    {startCamera ? (
                        <View style={styles.cameraContainer}>
                            <CameraView style={styles.camera} ref={cameraRef}>
                                <View style={styles.cameraActionContainer}>
                                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                        <Text style={styles.captureButtonText}>SNAP</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.captureButton, styles.cancelButton]} 
                                        onPress={() => setStartCamera(false)}
                                    >
                                        <Text style={styles.captureButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </CameraView>
                        </View>
                    ) : (
                        <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.sectionTitle}>Lodge New Grievance</Text>
                            

                            <Text style={styles.inputLabel}>Describe your complaint</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]} 
                                placeholder="e.g., Water pipe has been leaking for 5 days..." 
                                placeholderTextColor="#9CA3AF"
                                value={complaintText}
                                onChangeText={setComplaintText}
                                multiline={true}
                                numberOfLines={4}
                            />

                            {/* Camera Action Button With Dotted Styles */}
                            <Text style={styles.inputLabel}>Add Evidence</Text>
                            <TouchableOpacity style={styles.dottedMediaButton} onPress={verifyCameraPermission}>
                                <View style={styles.iconCircle}>
                                    <View style={styles.cameraVector}>
                                        <View style={styles.cameraLens} />
                                    </View>
                                </View>
                                <Text style={styles.mediaButtonText}>Open Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.button, loading && styles.buttonDisabled]} 
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Submit Complaint</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Classification Output Section */}
                    {result && (
                        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
                            <Text style={styles.resultTitle}>AI Classification Result</Text>
                            <Text style={styles.resultText}><Text style={styles.bold}>Category:</Text> {result.category}</Text>
                            <Text style={styles.resultText}><Text style={styles.bold}>Priority:</Text> {result.priority}</Text>
                            <Text style={styles.resultText}><Text style={styles.bold}>Urgency Reasoning:</Text> {result.urgency_reason}</Text>
                        </Animated.View>
                    )}

                    {/* Active Reports List */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.sectionTitle}>Active Reports List</Text>
                        {activeReports.map(report => (
                            <View key={report.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{report.title}</Text>
                                    <View style={[
                                        styles.badge, 
                                        report.priority === 'High' ? styles.badgeHigh : styles.badgeLow
                                    ]}>
                                        <Text style={styles.badgeText}>{report.priority}</Text>
                                    </View>
                                </View>
                                <Text style={styles.cardSubtitle}>Category: {report.category}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Resolved Issues Section */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.sectionTitle}>Resolved Issues</Text>
                        {resolvedIssues.map(issue => (
                            <View key={issue.id} style={styles.achievementCard}>
                                <Text style={styles.achievementTitle}>✔️ {issue.title}</Text>
                                <Text style={styles.achievementSubtitle}>Category: {issue.category}</Text>
                            </View>
                        ))}
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    bgCircleTop: {
        position: 'absolute',
        top: -150,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#4F46E5',
        opacity: 0.08,
    },
    bgCircleBottom: {
        position: 'absolute',
        bottom: -200,
        left: -150,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: '#818CF8',
        opacity: 0.1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    greeting: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'capitalize',
    },
    profileBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    profileBadgeText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statBox: {
        width: (width - 60) / 2,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#4F46E5',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        marginTop: 10,
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        marginBottom: 16,
        color: '#1F2937'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dottedMediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(238, 242, 255, 0.5)', // Translucent Background
        borderWidth: 2,
        borderColor: '#6366F1',
        borderStyle: 'dashed', // Dotted / dashed look
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        justifyContent: 'center'
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cameraVector: {
        width: 20,
        height: 16,
        borderRadius: 3,
        borderColor: '#4F46E5',
        borderWidth: 1.5,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center'
    },
    cameraLens: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderColor: '#4F46E5',
        borderWidth: 1.5,
    },
    mediaButtonText: {
        fontSize: 15,
        color: '#4F46E5',
        fontWeight: '700',
    },
    button: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5',
        marginBottom: 8,
    },
    resultText: {
        fontSize: 14,
        color: '#334155',
        marginBottom: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        width: '75%'
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgeHigh: {
        backgroundColor: '#FEF2F2',
        color: '#EF4444',
    },
    badgeLow: {
        backgroundColor: '#F0FDF4',
        color: '#22C55E',
    },
    achievementCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 12,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 4,
    },
    achievementSubtitle: {
        fontSize: 13,
        color: '#B45309',
    },
    cameraContainer: {
        height: 400,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cameraActionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    captureButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    cancelButton: {
        backgroundColor: '#EF4444',
    },
    captureButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bold: {
        fontWeight: 'bold',
    }
});