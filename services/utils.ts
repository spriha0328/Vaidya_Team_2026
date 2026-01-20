import { Message, StoredSession } from '../types';

// ==========================================
// 🔐 SECURITY & PRIVACY UTILS
// ==========================================

export const maskPII = (text: string): string => {
  let masked = text;
  // Redact Emails
  masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
  // Redact Phone Numbers (Simple 10-digit pattern)
  masked = masked.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  return masked;
};

// Simulate "Fernet" encryption using Base64 for local storage obfuscation
export const secureStorage = {
  setItem: (key: string, value: any) => {
    try {
      const stringVal = JSON.stringify(value);
      const encoded = btoa(unescape(encodeURIComponent(stringVal)));
      localStorage.setItem(key, encoded);
    } catch (e) {
      console.error("Storage failed", e);
    }
  },
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const decoded = decodeURIComponent(escape(atob(item)));
      return JSON.parse(decoded) as T;
    } catch (e) {
      console.error("Retrieval failed", e);
      return null;
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const logAuditEvent = (action: string, detail: string) => {
  const timestamp = new Date().toISOString();
  console.log(`%c[AUDIT_LOG] ${timestamp} | ${action} | ${detail}`, 'color: #7dd3fc; background: #334155; padding: 2px 4px; border-radius: 4px;');
};

// ==========================================
// 🔗 SHARING & PROFILE
// ==========================================

export const encodeShareData = (messages: Message[]): string => {
  // Simple Base64 encoding for URL sharing (Client-side only)
  // In production, use a shortened link service or database ID
  try {
    const json = JSON.stringify(messages);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    console.error("Encoding failed", e);
    return "";
  }
};

export const decodeShareData = (encoded: string): Message[] | null => {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (e) {
    console.error("Decoding failed", e);
    return null;
  }
};
