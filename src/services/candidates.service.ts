import { collection, doc, setDoc, Timestamp, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockCandidatesWithAI, MockCandidate } from '../data/mockCandidates';

interface FeedbackInput {
  feedback: string;
  interviewer_email: string;
  interviewer_name: string;
  isSelectedForNextRound: 'yes' | 'no';
  rating_out_of_10: number;
}

export const addFeedbackToCandidate = async (candidate_id: string, feedbackData: FeedbackInput) => {
  try {
    const docRef = doc(db, 'interview_candidates', candidate_id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Candidate not found');
    }

    // Get current completed rounds
    const currentData = docSnap.data();
    const completed_rounds = currentData.completed_rounds || '0';
    
    // Increment completed rounds if feedback was successful
    const newCompletedRounds = (parseInt(completed_rounds) + 1).toString();

    await updateDoc(docRef, {
      feedback: arrayUnion(feedbackData),
      completed_rounds: newCompletedRounds,
      // If not selected for next round, mark as completed
      status: feedbackData.isSelectedForNextRound === 'no' ? 'completed' : 'pending'
    });

    return true;
  } catch (error) {
    console.error('Error adding feedback:', error);
    throw error;
  }
}

export const addMockCandidatesToFirestore = async () => {
  try {
    const batch = mockCandidatesWithAI.map(async (candidate) => {
      // Convert the interview_time to Firestore Timestamp if it exists
      const candidateData = {
        ...candidate,
        interview_time: candidate.interview_time 
          ? Timestamp.fromMillis(candidate.interview_time.seconds * 1000)
          : null,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      };

      // Use the candidate's id from the mock data
      const candidateRef = doc(db, 'candidates_data', candidate.id);
      return setDoc(candidateRef, candidateData);
    });

    await Promise.all(batch);
    console.log('Successfully added mock candidates to Firestore');
    return true;
  } catch (error) {
    console.error('Error adding mock candidates:', error);
    return false;
  }
};
