import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACK_URL;

export interface P2PMessage {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
  };
}

export const chatService = {
  async sendMessage(receiverId: number, text: string): Promise<P2PMessage> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat/send`,
        { receiverId, text },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async getUnreadMessages(): Promise<P2PMessage[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/unread`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      throw error;
    }
  },

  async markAsRead(messageIds: number[]): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/chat/mark-read`,
        { messageIds },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  async getConversation(otherUserId: number): Promise<P2PMessage[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversation/${otherUserId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  async deleteMessage(messageId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/chat/${messageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
};
