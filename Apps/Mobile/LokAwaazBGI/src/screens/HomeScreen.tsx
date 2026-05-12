/**
 * HomeScreen.tsx — LokAwaz Civic Grievance Platform
 * Full integration: FastAPI AI classification → Firebase Firestore/Storage
 * Restore Aesthetic: Cyberpunk-lite (Indigos, Slates, Neon accents)
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
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
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Image,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  FirestoreError,
} from 'firebase/firestore';
import * as Location from 'expo-location'; // Location import

import { auth, db } from '../config/firebaseconfig';
import { submitGrievance } from '../services/dbService';
import { checkAndRegisterUser, saveUserProfile } from '../services/userService';

// ─── Icons ────────────────────────────────────────────────────────────────────
import { 
  Camera as CameraIcon, 
  X, 
  CheckCircle, 
  Bot, 
  ClipboardList, 
  Plus, 
  User, 
  Activity, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react-native';

// ─── FastAPI Integration ──────────────────────────────────────────────────────

const API_BASE = __DEV__
  ? 'http://10.50.234.31:8000' 
  : 'https://your-production-server.com';

export interface AIAnalysisResult {
  primary_category: string;
  secondary_category: string | null;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  needs_review: boolean;
  expanded_text: string;
  all_scores?: Record<string, number>;
}

async function analyzeGrievance(text: string): Promise<AIAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text_content: text, language_hint: 'en' }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Server error ${res.status}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('AI server timed out.');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Types & Constants ────────────────────────────────────────────────────────

interface ReportItem {
  id: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Active' | 'Routed' | 'Pending Review';
  createdAt: Timestamp;
}

type SubmitPhase = 'idle' | 'analyzing' | 'uploading' | 'success' | 'error';
const { width } = Dimensions.get('window');
const MAX_IMAGES = 4;

const PRIORITY_CONFIG: Record<string, { color: string, bg: string, label: string }> = {
  High:   { color: '#EF4444', bg: '#FEF2F2', label: 'HIGH' },
  Medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'MED' },
  Low:    { color: '#10B981', bg: '#ECFDF5', label: 'LOW' },
};

const STATUS_CONFIG: Record<string, { color: string, label: string }> = {
  Pending:          { color: '#64748B', label: 'Pending' },
  'Pending Review': { color: '#F59E0B', label: 'Reviewing' },
  'In Progress':    { color: '#6366F1', label: 'In Progress' },
  Routed:           { color: '#8B5CF6', label: 'Routed' },
  Resolved:         { color: '#10B981', label: 'Resolved' },
  Active:           { color: '#3B82F6', label: 'Active' },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface SkeletonProps {
  width: number | string;
  height: number | string;
  style?: any;
}

const SkeletonBlock = React.memo(({ width: w, height: h, style }: SkeletonProps) => {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ width: w, height: h, borderRadius: 6, backgroundColor: '#CBD5E1', opacity: pulse }, style]} />;
});

const AIPreviewBadge = React.memo(({ result }: { result: AIAnalysisResult }) => {
  const pct = Math.round(result.confidence * 100);
  const color = pct >= 55 ? '#10B981' : pct >= 25 ? '#F59E0B' : '#EF4444';
  
  return (
    <View style={aiBadgeStyles.wrap}>
      <View style={aiBadgeStyles.headerRow}>
        <Bot size={14} color="#6366F1" />
        <Text style={aiBadgeStyles.header}>AI Classification Active</Text>
      </View>
      <View style={aiBadgeStyles.row}>
        <Text style={[aiBadgeStyles.category, { color }]}>{result.primary_category}</Text>
        <View style={[aiBadgeStyles.confPill, { backgroundColor: color + '15', borderColor: color + '40', borderWidth: 1 }]}>
          <Text style={[aiBadgeStyles.confText, { color }]}>{pct}% Match</Text>
        </View>
      </View>
      {result.needs_review && (
        <View style={aiBadgeStyles.warningRow}>
          <AlertTriangle size={12} color="#D97706" />
          <Text style={aiBadgeStyles.warning}>Low confidence — queued for manual review</Text>
        </View>
      )}
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: { navigation: any }) {
  const user = auth.currentUser;
  const uid = user?.uid;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';

  // Form & UI States
  const [description, setDescription] = useState('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  
  // Data States
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const exists = await checkAndRegisterUser(uid);
      if (!exists) setShowSetup(true);
    })();

    const q = query(collection(db, 'grievances'), where('userId', '==', uid), where('status', 'in', ['Pending', 'In Progress', 'Active', 'Routed', 'Pending Review']));
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportItem));
      items.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setReports(items);
      setLoadingReports(false);
    }, () => setLoadingReports(false));

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 100, useNativeDriver: true }),
    ]).start();
    return () => unsub();
  }, [uid]);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) {
        setCapturedImages(prev => [...prev, photo.uri]);
        setCameraOpen(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!uid) return;
    if (description.trim().length < 10) return Alert.alert('Input Error', 'Please describe the issue in at least 10 words.');

    setPhase('analyzing');
    try {
      // ─── 1. GRAB GPS LOCATION ───
      let locationCoords: { latitude: number; longitude: number } | undefined = undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Using Balanced accuracy so it doesn't hang forever waiting for a perfect satellite lock
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          locationCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          console.log("GPS Acquired:", locationCoords);
        } else {
          console.log("Location permission denied by user.");
        }
      } catch (locErr) {
        console.log("Failed to fetch location:", locErr);
      }

      // ─── 2. RUN AI CLASSIFICATION ───
      let ai: AIAnalysisResult;
      try {
        ai = await analyzeGrievance(description);
      } catch (e) {
        ai = { primary_category: 'Uncategorized', secondary_category: null, confidence: 0, priority: 'Medium', status: 'Pending Review', needs_review: true, expanded_text: description };
      }
      setAiResult(ai);
      setPhase('uploading');

      // ─── 3. SUBMIT TO FIREBASE WITH LOCATION ───
      const submission = await submitGrievance(uid, {
        citizenName: fullName || displayName,
        description: description.trim(),
        category: ai.primary_category,
        priority: ai.priority,
        status: ai.status as any,
        aiMeta: { confidence: ai.confidence, needs_review: ai.needs_review, all_scores: ai.all_scores ?? {} }
      }, capturedImages[0], locationCoords); // <-- locationCoords safely passed here

      if (submission.success) {
        setSubmittedId(submission.id!);
        setPhase('success');
        Animated.spring(successScale, { toValue: 1, damping: 12, useNativeDriver: true }).start();
        setTimeout(() => {
          navigation.navigate('TrackReport', { reportId: submission.id });
          setPhase('idle');
          setDescription('');
          setCapturedImages([]);
          setAiResult(null);
        }, 2200);
      }
    } catch (err: any) {
      setPhase('error');
      Alert.alert('Submission Failed', err.message);
    }
  };

  if (phase === 'success') {
    return (
      <View style={styles.successOverlay}>
        <View style={styles.glowBgSuccess} />
        <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
          <View style={{ marginBottom: 16 }}>
            <CheckCircle size={64} color="#6366F1" strokeWidth={1.5} />
          </View>
          <Text style={styles.successTitle}>Report Filed</Text>
          <Text style={styles.successCategory}>{aiResult?.primary_category}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.successSub}>ID: {submittedId?.slice(0, 8).toUpperCase()}</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (cameraOpen) {
    return (
      <View style={styles.cameraFullscreen}>
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />
        <View style={styles.cameraHUD}>
          <Text style={styles.cameraCounter}>{capturedImages.length} / {MAX_IMAGES} captured</Text>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.camBtnCancel} onPress={() => setCameraOpen(false)}>
              <X size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.camBtnSnap} onPress={handleCapture}>
              <View style={styles.camBtnSnapInner} />
            </TouchableOpacity>
            <View style={{ width: 56 }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.root}>
        {/* Subtle Cyberpunk Ambient Glows */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View>
                <Text style={styles.greetingSmall}>System Active</Text>
                <Text style={styles.greetingName}>Hello, {displayName}</Text>
              </View>
              <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
                <User size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            {/* Stats */}
            <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Activity size={18} color="#6366F1" />
                </View>
                {loadingReports ? <SkeletonBlock width={40} height={28} /> : <Text style={styles.statValue}>{reports.length}</Text>}
                <Text style={styles.statLabel}>Active Reports</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <CheckCircle size={18} color="#10B981" />
                </View>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.sectionTitle}>Lodge Grievance</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              {aiResult && phase !== 'idle' && <AIPreviewBadge result={aiResult} />}

              <ScrollView horizontal contentContainerStyle={styles.imageRow} showsHorizontalScrollIndicator={false}>
                {capturedImages.map((uri, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumb} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}>
                      <X size={12} color="#FFF" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
                {capturedImages.length < MAX_IMAGES && (
                  <TouchableOpacity style={styles.addImageCard} onPress={() => setCameraOpen(true)}>
                    <View style={{ marginBottom: 4 }}>
                      <Plus size={20} color="#6366F1" />
                    </View>
                    <Text style={styles.addImageLabel}>Photo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <TouchableOpacity 
                style={[styles.submitBtn, (phase === 'analyzing' || phase === 'uploading') && styles.submitBtnBusy]} 
                onPress={handleSubmit}
                disabled={phase === 'analyzing' || phase === 'uploading'}
                activeOpacity={0.8}
              >
                {phase === 'analyzing' || phase === 'uploading' ? (
                  <View style={styles.submitBtnInner}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitBtnTextBusy}>
                      {phase === 'analyzing' ? 'Processing via AI...' : 'Establishing Uplink...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>Transmit Report</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Reports List */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Live Tracking</Text>
              </View>
              
              {loadingReports ? (
                <>
                  <SkeletonBlock width="100%" height={72} style={{ marginBottom: 12, borderRadius: 12 }} />
                  <SkeletonBlock width="100%" height={72} style={{ borderRadius: 12 }} />
                </>
              ) : reports.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={{ marginBottom: 12 }}>
                    <ClipboardList size={48} color="#CBD5E1" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyText}>No active transmissions.</Text>
                </View>
              ) : reports.map(r => (
                <TouchableOpacity key={r.id} style={[styles.card, { borderLeftColor: PRIORITY_CONFIG[r.priority]?.color || '#94A3B8' }]} activeOpacity={0.7}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{r.description}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusIndicator, { backgroundColor: STATUS_CONFIG[r.status]?.color || '#6366F1' }]} />
                      <Text style={[styles.cardStatus, { color: STATUS_CONFIG[r.status]?.color || '#6366F1' }]}>
                        {STATUS_CONFIG[r.status]?.label || r.status}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_CONFIG[r.priority]?.bg || '#F1F5F9' }]}>
                    <Text style={[styles.priorityText, { color: PRIORITY_CONFIG[r.priority]?.color || '#64748B' }]}>{r.priority}</Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <ChevronRight size={20} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Setup Modal */}
      <Modal visible={showSetup} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>System Init</Text>
            <Text style={styles.modalSub}>Complete your citizen profile to proceed.</Text>
            <TextInput style={styles.modalInput} placeholder="Full Designation (Name)" placeholderTextColor="#94A3B8" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.modalInput} placeholder="Comms Line (Mobile)" placeholderTextColor="#94A3B8" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
            <TouchableOpacity style={styles.submitBtn} onPress={async () => {
              if (fullName.trim() && mobile.length === 10) {
                setSetupLoading(true);
                await saveUserProfile(uid!, { name: fullName, email: user?.email || '', mobile });
                setShowSetup(false); setSetupLoading(false);
              }
            }}>
              {setupLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Initialize</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const aiBadgeStyles = StyleSheet.create({
  wrap: { backgroundColor: '#EEF2FF', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#C7D2FE', borderLeftWidth: 4, borderLeftColor: '#6366F1' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  header: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.2, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  category: { fontSize: 18, fontWeight: '800', flex: 1, letterSpacing: -0.5 },
  confPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  confText: { fontSize: 12, fontWeight: '800' },
  warningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  warning: { fontSize: 11, color: '#B45309', fontWeight: '600' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 60 },
  
  glowTop: { position: 'absolute', top: -150, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: '#6366F1', opacity: 0.08 },
  glowBottom: { position: 'absolute', bottom: -200, left: -150, width: 500, height: 500, borderRadius: 250, backgroundColor: '#818CF8', opacity: 0.1 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  greetingSmall: { fontSize: 14, color: '#64748B', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  greetingName: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  avatarBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 },
  statHeader: { marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginBottom: 2, letterSpacing: -1 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16, letterSpacing: -0.5 },
  inputWrapper: { backgroundColor: '#F1F5F9', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  input: { padding: 16, fontSize: 15, color: '#0F172A' },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  imageRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  thumbWrap: { position: 'relative', width: 72, height: 72 },
  thumb: { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  removeBtn: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  addImageCard: { width: 72, height: 72, borderRadius: 8, borderWidth: 1.5, borderColor: '#818CF8', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF2FF' },
  addImageLabel: { fontSize: 11, fontWeight: '600', color: '#6366F1' },
  
  submitBtn: { backgroundColor: '#6366F1', padding: 18, borderRadius: 8, alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnBusy: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  submitBtnTextBusy: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardBody: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3 },
  cardStatus: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  emptyState: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#94A3B8' },
  
  cameraFullscreen: { flex: 1, backgroundColor: '#000' },
  cameraHUD: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingHorizontal: 32, backgroundColor: 'rgba(15,23,42,0.6)' },
  cameraCounter: { color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24, letterSpacing: 1 },
  cameraControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  camBtnCancel: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  camBtnSnap: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  camBtnSnapInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },
  
  successOverlay: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  glowBgSuccess: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#6366F1', opacity: 0.15 },
  successCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 40, alignItems: 'center', width: width * 0.8, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  successCategory: { fontSize: 16, fontWeight: '700', color: '#6366F1', marginBottom: 24 },
  idBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  successSub: { fontSize: 13, fontWeight: '700', color: '#64748B', letterSpacing: 1 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  modalSub: { fontSize: 14, color: '#64748B', marginBottom: 24, fontWeight: '500' },
  modalInput: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 16, fontSize: 15, marginBottom: 16, color: '#0F172A', fontWeight: '500' },
});