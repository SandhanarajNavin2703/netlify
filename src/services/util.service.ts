import { addDoc, collection } from "firebase/firestore";
import { db } from "../config/firebase";

export const saveResume = async (resumeData: Record<string, any>) => {
    try {
      const docRef = await addDoc(collection(db, "resumes"), resumeData);
      console.log("✅ Resume saved with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error adding resume:", error);
      throw error;
    }
  };