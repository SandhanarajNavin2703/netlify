import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, Timestamp, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message, ChatSession } from '../types';

export const createNewChat = async (moduleId: string, userId: string) => {
  const newChat = {
    moduleId,
    userId,
    title: 'New Chat',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    messages: []
  };

  const chatRef = await addDoc(collection(db, 'chats'), newChat);
  return { id: chatRef.id, ...newChat };
};

export const getChatHistory = async () => {
  const chatsQuery = query(
    collection(db, 'chats'),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(chatsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ChatSession[];
};

export const addMessageToChat = async (chatId: string, message: Message) => {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    messages: arrayUnion(message),
    updatedAt: Timestamp.now()
  });
};

export const updateChatTitle = async (chatId: string, title: string) => {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    title,
    updatedAt: Timestamp.now()
  });
};

export const deleteChat = async (chatId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  await deleteDoc(chatRef);
};

export const sendChatMessage = async (message: string, chatId: string): Promise<{ message: string; result: any }> => {
  console.log('Sending chat message:', message, 'to chat ID:', chatId);
  const role = sessionStorage.getItem('userRole') || ''; 
  const payload = {
    message: message,
    sessionId: chatId,
    role: role
  }
  try {
    const response = await fetch('https://good-loops-attack.loca.lt/chat/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};
