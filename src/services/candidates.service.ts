import { collection, doc, setDoc, Timestamp, updateDoc, arrayUnion, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockCandidatesWithAI, MockCandidate } from '../data/mockCandidates';

interface FeedbackInput {
  feedback: string;
  interviewer_email: string;
  interviewer_name: string;
  isSelectedForNextRound: 'yes' | 'no';
  rating_out_of_10: number;
}

export const addFeedbackToCandidate = async (candidate_id: string, currentRounds: string, feedbackData: FeedbackInput) => {
  console.log('Adding feedback for candidate:', candidate_id, currentRounds, feedbackData);

  try {
    const q = query(
      collection(db, 'interview_candidates'),
      where('candidate_id', '==', candidate_id)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Candidate not found');
    }

    const docRef = querySnapshot.docs[0].ref;
    // const currentData = querySnapshot.docs[0].data();
    // const completed_rounds = currentData.completed_rounds || '0';
    // const newCompletedRounds = (parseInt(completed_rounds) + 1).toString();
    const currentData = querySnapshot.docs[0].data();
    const feedbackArray = currentData.feedback || [];

    const targetIndex = parseInt(currentRounds) - 1;

    // Expand array if index doesn't exist
    while (feedbackArray.length <= targetIndex) {
      feedbackArray.push({});
    }

    // Update the specific index
    feedbackArray[targetIndex] = feedbackData;

    await updateDoc(docRef, {
      feedback: feedbackArray,
      // completed_rounds: newCompletedRounds,
      // status: feedbackData.isSelectedForNextRound === 'no' ? 'completed' : 'pending'
    });

    return true;
  } catch (error) {
    console.error('Error adding feedback:', error);
    throw error;
  }
};

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
