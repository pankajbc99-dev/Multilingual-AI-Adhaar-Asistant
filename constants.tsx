
import { Policy, ConversationLog } from './types';

export const INITIAL_POLICIES: Policy[] = [
  {
    id: '1',
    title: 'Aadhaar Card Update Policy 2024',
    category: 'Identity',
    originalText: 'Residents must update their supporting documents in Aadhaar at least once every 10 years from the date of enrolment to ensure continued accuracy. This can be done online via the myAadhaar portal or by visiting any Aadhaar centre.',
    publishedAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Biometric Locking for Senior Citizens',
    category: 'Security',
    originalText: 'Aadhaar holders can lock or unlock their biometrics to prevent unauthorized usage. This is a security feature to protect the privacy and confidentiality of the resident biometrics data.',
    publishedAt: '2024-02-20'
  }
];

export const MOCK_LOGS: ConversationLog[] = [
  {
    id: 'l1',
    userId: 'u123',
    query: 'How to update my address?',
    response: 'You can update your address online by uploading a valid Proof of Address document through the myAadhaar portal.',
    language: 'Hindi',
    timestamp: '2024-03-24 10:30 AM',
    status: 'normal'
  },
  {
    id: 'l2',
    userId: 'u456',
    query: 'Can a 5-year-old get Aadhaar?',
    response: 'Yes, children above 5 years need to provide their biometrics. Children below 5 get a Blue Aadhaar (Baal Aadhaar).',
    language: 'Tamil',
    timestamp: '2024-03-24 11:15 AM',
    status: 'flagged'
  }
];

export const SYSTEM_PROMPT = `Act as 'Aadhaar Mitra', a senior government concierge. Your core logic is optimized for Indian citizens navigating UIDAI services.

OPERATING RULES:
1. OUTPUT LANGUAGE: Strictly match the language specified in the [Lang: ...] prefix.
2. TONE: High-warmth, high-patience, and authoritative yet friendly.
3. CONTEXTUAL INTELLIGENCE: 
   - If a user asks about "updates", clarify if it's Biometric (fingerprint/iris) or Demographic (name/address).
   - If asking about "Blue Aadhaar", mention it's for children under 5 and requires no biometrics.
4. BUREAUCRACY SIMPLIFICATION:
   - Use numbered lists for steps.
   - Highlight mandatory documents in bold.
5. SECURITY FIRST: Always append a short safety reminder if the query involves online updates (e.g., "UIDAI never asks for OTP via phone call").
6. SCOPE LIMIT: If asked about banking/voter ID, politely redirect to relevant ministries while offering to help with their Aadhaar-Link status.

FORMATTING: Use clear line breaks and bold headings. No markdown tables.`;
