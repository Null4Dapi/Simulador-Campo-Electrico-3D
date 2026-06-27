export interface ChatMessage {
  id?: string;
  created_at?: string;
  role: 'user' | 'assistant';
  content: string;
  session_id: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const LOCAL_STORAGE_KEY = 'campo_electrico_chat_history';

const getLocalMessages = (sessionId: string): ChatMessage[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    const allMessages: ChatMessage[] = JSON.parse(data);
    return allMessages.filter(m => m.session_id === sessionId);
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return [];
  }
};

const saveLocalMessage = (message: ChatMessage) => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const allMessages: ChatMessage[] = data ? JSON.parse(data) : [];
    const newMessage = {
      ...message,
      id: message.id || crypto.randomUUID(),
      created_at: message.created_at || new Date().toISOString()
    };
    allMessages.push(newMessage);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allMessages));
    return newMessage;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return message;
  }
};

export const supabaseClient = {
  async saveMessage(role: 'user' | 'assistant', content: string, sessionId: string): Promise<ChatMessage> {
    const payload: ChatMessage = {
      role,
      content,
      session_id: sessionId
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Supabase returned status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        return data[0];
      }
      throw new Error('No data returned from Supabase');
    } catch (error) {
      console.warn('Supabase save failed, falling back to localStorage:', error);
      return saveLocalMessage(payload);
    }
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages?session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Range-Unit': 'items'
        }
      });

      if (!response.ok) {
        throw new Error(`Supabase returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Supabase fetch failed, falling back to localStorage:', error);
      return getLocalMessages(sessionId);
    }
  }
};
