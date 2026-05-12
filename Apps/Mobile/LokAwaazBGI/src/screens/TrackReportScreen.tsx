/**
 * TrackReportScreen.tsx — LokAwaz Civic Grievance Platform
 * Aesthetic: Modern, Clean, Friendly Premium UI
 * Update: Added explicit Department visibility in Overview and Timeline.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
} from 'react-native';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Cpu,
  UserCircle,
  Phone,
  MapPin,
  Image as ImageIcon,
  ShieldCheck,
  CircleDashed,
  Wrench,
  Landmark
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignedWorker {
  name: string;
  role: string;
  phone: string;
  assignedAt?: Timestamp;
}

interface ReportDetails {
  id: string;
  description: string;
  category: string;
  department?: string; // <-- Added Department
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Routed' | 'In Progress' | 'Resolved' | 'Pending Review';
  createdAt: Timestamp;
  imageUrl?: string;
  aiMeta?: {
    confidence: number;
    needs_review?: boolean;
  };
  assignedWorker?: AssignedWorker;
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  High:   { color: '#EF4444', bg: '#FEF2F2', label: 'High Priority' },
  Medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'Medium Priority' },
  Low:    { color: '#10B981', bg: '#ECFDF5', label: 'Low Priority' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  Pending:          { color: '#64748B', bg: '#F1F5F9', label: 'Received' },
  'Pending Review': { color: '#F59E0B', bg: '#FFFBEB', label: 'Under Review' },
  Routed:           { color: '#8B5CF6', bg: '#F5F3FF', label: 'Forwarded' },
  'In Progress':    { color: '#3B82F6', bg: '#EFF6FF', label: 'In Progress' },
  Resolved:         { color: '#10B981', bg: '#ECFDF5', label: 'Fixed' },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const SkeletonBlock = React.memo(({ width: w, height: h, style, borderRadius = 6 }: any) => {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ width: w, height: h, borderRadius, backgroundColor: '#CBD5E1', opacity: pulse }, style]} />;
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrackReportScreen({ route, navigation }: any) {
  const { reportId } = route.params;
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!reportId) return;

    const docRef = doc(db, 'grievances', reportId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setReport({ id: snap.id, ...snap.data() } as ReportDetails);
        setLoading(false);
      }
    });

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 100, useNativeDriver: true }),
    ]).start();

    return () => unsub();
  }, [reportId]);

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp?.seconds) return 'Time unavailable';
    const d = new Date(timestamp.seconds * 1000);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const callWorker = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const isUplinked = !!report;
  const hasCategoryAssigned = Boolean(report?.category && report.category.trim() !== '' && report.category !== 'Uncategorized');
  const isRouted = isUplinked && (hasCategoryAssigned || ['Routed', 'In Progress', 'Resolved'].includes(report?.status || ''));
  const isInProgress = report?.status === 'In Progress' || report?.status === 'Resolved';
  const isResolved = report?.status === 'Resolved';

  // Fallback string if backend hasn't assigned a formal department yet
  const displayDepartment = report?.department || (report?.category ? `${report.category} Dept.` : 'Awaiting Assignment');

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.root}>
        
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerLabel}>REPORT ID</Text>
              <Text style={styles.headerId}>#{reportId ? reportId.slice(0, 8).toUpperCase() : '...'}</Text>
            </View>
            <View style={styles.spacer} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              
              <View style={styles.overviewCard}>
                {loading ? (
                  <View>
                    <SkeletonBlock width="40%" height={24} style={styles.skeletonMargin} />
                    <SkeletonBlock width="100%" height={60} style={styles.skeletonMarginLarge} />
                    <SkeletonBlock width="100%" height={140} borderRadius={12} />
                  </View>
                ) : (
                  <View>
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[report!.status]?.bg || '#F1F5F9' }]}>
                        <Text style={[styles.statusText, { color: STATUS_CONFIG[report!.status]?.color || '#64748B' }]}>
                          {STATUS_CONFIG[report!.status]?.label || report!.status}
                        </Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_CONFIG[report!.priority]?.bg }]}>
                        <Text style={[styles.priorityText, { color: PRIORITY_CONFIG[report!.priority]?.color }]}>
                          {PRIORITY_CONFIG[report!.priority]?.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.categoryTitle}>{report?.category || 'General Issue'}</Text>
                    
                    {/* ─── Department Tag ─── */}
                    <View style={styles.departmentRow}>
                      <Landmark size={14} color="#6366F1" style={styles.iconMargin} />
                      <Text style={styles.departmentText}>{displayDepartment}</Text>
                    </View>

                    <Text style={styles.descriptionText}>{report?.description}</Text>

                    {report?.imageUrl ? (
                      <View style={styles.imageWrapper}>
                        <Image source={{ uri: report.imageUrl }} style={styles.imageFull} resizeMode="cover" />
                        <View style={styles.imageOverlay}>
                          <MapPin size={14} color="#FFFFFF" style={styles.iconMargin} />
                          <Text style={styles.imageOverlayText}>Location Attached</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noImagePlaceholder}>
                        <ImageIcon size={24} color="#94A3B8" />
                        <Text style={styles.noImageText}>No photo attached</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {(!loading && report?.assignedWorker) ? (
                <View style={styles.workerCard}>
                  <View style={styles.workerRow}>
                    <View style={styles.avatarWrap}>
                      <UserCircle size={36} color="#6366F1" strokeWidth={1.5} />
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerLabel}>ASSIGNED TO</Text>
                      <Text style={styles.workerName}>{report.assignedWorker.name}</Text>
                      <Text style={styles.workerRole}>{report.assignedWorker.role}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.callBtn} 
                      onPress={() => callWorker(report.assignedWorker!.phone)}
                      activeOpacity={0.7}
                    >
                      <Phone size={20} color="#FFFFFF" fill="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Report Progress</Text>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.node, isUplinked ? styles.nodeActive : styles.nodeInactive]}>
                    <Clock size={16} color={isUplinked ? '#6366F1' : '#94A3B8'} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, isUplinked ? styles.textActive : null]}>Report Submitted</Text>
                    <Text style={styles.stepSub}>Your report has been successfully received.</Text>
                    {isUplinked ? (
                      <Text style={styles.stepTime}>{formatDate(report?.createdAt)}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.timelineStep}>
                  <View style={[styles.node, isRouted ? styles.nodeActive : styles.nodeInactive]}>
                    <Cpu size={16} color={isRouted ? '#6366F1' : '#94A3B8'} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, isRouted ? styles.textActive : null]}>AI Review & Routing</Text>
                    {/* ─── Department Mentions in Timeline ─── */}
                    <Text style={styles.stepSub}>
                      {isRouted 
                        ? `Our AI matched your issue and forwarded it to the ${displayDepartment}.`
                        : 'Our AI is checking your issue to find the right department.'}
                    </Text>
                    {report?.aiMeta ? (
                      <View style={styles.aiMetaBadge}>
                        <ShieldCheck size={12} color="#10B981" style={styles.iconMargin} />
                        <Text style={styles.aiMetaText}>AI Matched ({Math.round(report.aiMeta.confidence * 100)}%)</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.timelineStep}>
                  <View style={[styles.node, isInProgress ? styles.nodeActive : styles.nodeInactive]}>
                    <Wrench size={16} color={isInProgress ? '#6366F1' : '#94A3B8'} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, isInProgress ? styles.textActive : null]}>Worker Assigned</Text>
                    <Text style={styles.stepSub}>
                      {isInProgress ? 'A team member is currently working on this issue.' : 'Waiting for a worker to pick up the task.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineStep}>
                  <View style={[styles.node, isResolved ? styles.nodeSuccess : styles.nodeInactive]}>
                    {isResolved ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <CircleDashed size={16} color="#94A3B8" />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, isResolved ? styles.textSuccess : null]}>Issue Fixed</Text>
                    <Text style={styles.stepSub}>
                      {isResolved ? 'The problem has been successfully solved.' : 'Waiting for the final fix confirmation.'}
                    </Text>
                  </View>
                </View>

              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 80 },
  
  glowTop: { position: 'absolute', top: -100, right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: '#6366F1', opacity: 0.06 },
  glowBottom: { position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, borderRadius: 250, backgroundColor: '#818CF8', opacity: 0.06 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#F8FAFC' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 4 },
  headerId: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  spacer: { width: 44 },

  overviewCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#64748B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  priorityText: { fontSize: 12, fontWeight: '700' },
  
  categoryTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  departmentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 16 },
  departmentText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  descriptionText: { fontSize: 16, color: '#475569', lineHeight: 24, marginBottom: 24 },
  
  imageWrapper: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  imageFull: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(15,23,42,0.75)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  imageOverlayText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  noImagePlaceholder: { width: '100%', height: 120, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  noImageText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  workerCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#E0E7FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  workerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  workerInfo: { flex: 1 },
  workerLabel: { fontSize: 11, fontWeight: '700', color: '#6366F1', letterSpacing: 0.5, marginBottom: 4 },
  workerName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  workerRole: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  callBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 24, paddingLeft: 4 },
  timelineContainer: { paddingLeft: 16, position: 'relative' },
  timelineLine: { position: 'absolute', top: 20, bottom: 40, left: 35, width: 2, backgroundColor: '#E2E8F0', zIndex: 0 },
  
  timelineStep: { flexDirection: 'row', marginBottom: 36, position: 'relative', zIndex: 1 },
  node: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 2 },
  nodeActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  nodeSuccess: { borderColor: '#10B981', backgroundColor: '#ECFDF5', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  nodeInactive: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  
  stepContent: { flex: 1, marginLeft: 16, paddingTop: 8 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#94A3B8', marginBottom: 6 },
  textActive: { color: '#0F172A' },
  textSuccess: { color: '#10B981' },
  stepSub: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  stepTime: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  
  aiMetaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#D1FAE5' },
  aiMetaText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  
  skeletonMargin: { marginBottom: 12 },
  skeletonMarginLarge: { marginBottom: 16 },
  iconMargin: { marginRight: 6 }
});