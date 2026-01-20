export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachment?: {
    mimeType: string;
    data: string; // Base64
  };
  groundingMetadata?: GroundingMetadata;
  isError?: boolean;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: any[];
  searchEntryPoint?: any;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    sourcePlace?: {
       name?: string;
       formattedAddress?: string;
    };
  };
}

export interface StoredSession {
  id: string;
  timestamp: number;
  preview: string;
  messages: Message[];
}

export interface UserProfile {
  name: string;
  initials: string;
  avatarColor: string; // Tailwind class or hex
}

export interface LocationData {
  latitude: number;
  longitude: number;
}