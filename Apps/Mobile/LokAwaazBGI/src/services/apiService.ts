// services/apiService.ts

const API_BASE = __DEV__ ? 'http://10.50.234.31:8000' : '...';
export interface AIAnalysisResult {
  primary_category: string;
  secondary_category: string | null;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  needs_review: boolean;
  expanded_text: string;
}

export async function analyzeGrievance(text: string): Promise<AIAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  console.log('[AI][apiService] analyzeGrievance called with:', text);
  console.log('[AI][apiService] Using API_BASE:', API_BASE);

  try {
    const url = `${API_BASE}/analyze`;
    const payload = { text_content: text, language_hint: 'en' };
    console.log('[AI][apiService] Sending POST to:', url);
    console.log('[AI][apiService] Payload:', payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    console.log('[AI][apiService] Response status:', res.status);

    if (!res.ok) {
      let err = {};
      try {
        err = await res.json();
      } catch (jsonErr) {
        console.log('[AI][apiService] Error parsing error response:', jsonErr);
      }
      console.log('[AI][apiService] Error response:', err);
      throw new Error((err as any).detail ?? `Server error ${res.status}`);
    }

    const data = await res.json();
    console.log('[AI][apiService] Success response:', data);
    return data;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.log('[AI][apiService] Request timed out.');
      throw new Error('AI server timed out. Try again.');
    }
    console.log('[AI][apiService] Fetch error:', e);
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}