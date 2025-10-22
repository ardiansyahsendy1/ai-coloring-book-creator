
export interface GeneratedPage {
  id: number;
  label: string;
  imageUrl: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
