import React, { useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    ScrollView,
    Animated,
    Dimensions
} from 'react-native';
import { auth } from '../config/firebaseconfig';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const userEmail = auth.currentUser?.email || 'developer@example.com';
    const displayName = userEmail.split('@')[0];

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={styles.mainContainer}>
            {/* Geometric Shapes in the Background */}
            <View style={styles.bgCircleTop} />
            <View style={styles.bgCircleBottom} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView 
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Card Section */}
                    <Animated.View 
                        style={[
                            styles.profileCard, 
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.nameText}>{displayName}</Text>
                        <Text style={styles.emailText}>{userEmail}</Text>
                    </Animated.View>

                    {/* Analytical & Performance Summary */}
                    <Animated.View 
                        style={[
                            styles.section, 
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Performance Analytics</Text>

                        {/* First Analytical Card */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>Issue Redressal Rate</Text>
                                <Text style={styles.chartPercentage}>92%</Text>
                            </View>

                            {/* Graphical Progress Bar Indicator */}
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressBar, { width: '92%' }]} />
                            </View>

                            <View style={styles.chartFooter}>
                                <Text style={styles.chartFooterText}>12 Reports Handled</Text>
                                <Text style={styles.chartFooterText}>Updated Today</Text>
                            </View>
                        </View>

                        {/* Side-by-Side Analytical Metric Cards */}
                        <View style={styles.metricsRow}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>0.8s</Text>
                                <Text style={styles.metricLabel}>Avg. AI Response</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>Tier 1</Text>
                                <Text style={styles.metricLabel}>Security Level</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Settings & Options Group */}
                    <Animated.View 
                        style={[
                            styles.section, 
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Feature coming soon!')}>
                            <Text style={styles.menuText}>Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Feature coming soon!')}>
                            <Text style={styles.menuText}>App Preferences</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Feature coming soon!')}>
                            <Text style={styles.menuText}>Security & Passwords</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View 
                        style={[
                            styles.section, 
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Support & About</Text>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Version 1.0.0')}>
                            <Text style={styles.menuText}>App Version</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Contacting support...')}>
                            <Text style={styles.menuText}>Contact Support</Text>
                        </TouchableOpacity>
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
        top: -100,
        right: -100,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: '#4F46E5',
        opacity: 0.06,
    },
    bgCircleBottom: {
        position: 'absolute',
        bottom: -150,
        left: -120,
        width: 450,
        height: 450,
        borderRadius: 225,
        backgroundColor: '#818CF8',
        opacity: 0.08,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        padding: 24,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    nameText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
        marginLeft: 4,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F9FAFB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    chartPercentage: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4F46E5',
    },
    progressTrack: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    chartFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chartFooterText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    metricBox: {
        width: (width - 60) / 2,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F9FAFB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    menuItem: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F9FAFB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    menuText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
});