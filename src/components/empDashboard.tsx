import React, { useEffect, useState } from "react";
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { X, ChevronLeft, ChevronRight, Eye, ExternalLink } from 'lucide-react';
import { onAuthChange } from '../services/auth.service';
import { getOrCreateUser, UserData } from '../services/user.service';

interface Props {
  onSendReminder: (candidateId: string) => void;
  candidates: Candidate[];
}

interface ScheduledEvent {
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  htmlLink: string;
  id: string;
}

interface CandidateFeedback {
  feedback: string;
  interviewer_email: string;
  interviewer_name: string | null;
  isSelectedForNextRound: string;
  meet_link?: string;
  rating_out_of_10: number;
  compensation?: string;
  scheduled_event?: ScheduledEvent;
  round?: number;
}

interface Candidate {
  id: string;
  name: string;
  job_id: string;
  email: string;
  phone_no: string;
  resume_url: string;
  total_experience_in_years: string;
  technical_skills: string;
  previous_companies: Array<{
    name: string;
    years: string;
    job_responsibilities: string;
  }>;
  ai_fit_score: string;
  completed_rounds?: string;
  no_of_interviews?: number;
  interview_status?: 'pending' | 'scheduled' | 'completed' | 'rescheduled';
  interview_time?: Timestamp;
  feedback?: CandidateFeedback[];
}

interface InterviewStats {
  totalScheduled: number;
  pendingCandidates: number;
  upcomingInterviews: number;
  rescheduleRequests: number;
  todayInterviews: number;
  next7DaysInterviews: number;
  highScoreCandidates?: number;
}

interface InterviewCandidate {
  candidate_id: string;
  feedback: CandidateFeedback[];
  id: string;
  job_id: string;
  no_of_interviews: number;
  completed_rounds?: string;
  status?: 'pending' | 'scheduled' | 'completed';
}

const getNextInterview = (feedback: CandidateFeedback[] | undefined) => {
  if (!feedback || feedback.length === 0 || !feedback[0].scheduled_event) {
    return null;
  }
  return new Date(feedback[0].scheduled_event.start.dateTime);
};

const EmpDashboard: React.FC<Props> = ({
  onSendReminder,
  candidates
}) => {
  const [stats, setStats] = useState<InterviewStats>({
    totalScheduled: 0,
    pendingCandidates: 0,
    upcomingInterviews: 0,
    rescheduleRequests: 0,
    todayInterviews: 0,
    next7DaysInterviews: 0,
    highScoreCandidates: 0
  });

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewCandidates, setInterviewCandidates] = useState<Record<string, InterviewCandidate>>({});
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'round'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch current user data
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const userData = await getOrCreateUser(user);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch interview candidates data
  useEffect(() => {
    const unsubscribeInterviews = onSnapshot(collection(db, 'interview_candidates'), (snapshot) => {
      const interviewData: Record<string, InterviewCandidate> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as InterviewCandidate;
        // Only include candidates where the current user is the interviewer
        if (data.feedback?.some((f) => f.interviewer_email === currentUser?.email)) {
          interviewData[data.candidate_id] = data;
        }
      });
      setInterviewCandidates(interviewData);
    });

    return () => unsubscribeInterviews();
  }, [currentUser?.email]);

  // Update loading state after data is fetched
  useEffect(() => {
    if (currentUser && Object.keys(interviewCandidates).length > 0) {
      setIsLoading(false);
    }
  }, [currentUser, interviewCandidates]);

  // Calculate stats whenever candidates change
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const next7Days = new Date(startOfToday);
    next7Days.setDate(next7Days.getDate() + 7);

    const assignedCandidates = candidates.filter(c => 
      interviewCandidates[c.id]?.feedback?.some(f => f.interviewer_email === currentUser?.email)
    );

    const newStats: InterviewStats = {
      totalScheduled: assignedCandidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        return interviewData?.feedback?.some(f => f.scheduled_event);
      }).length,
      pendingCandidates: 0, // Not relevant for employee view
      upcomingInterviews: 0, // Not relevant for employee view
      rescheduleRequests: 0, // Not relevant for employee view
      todayInterviews: assignedCandidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        if (!interviewData?.feedback?.[0]?.scheduled_event) return false;
        const nextInterview = new Date(interviewData.feedback[0].scheduled_event.start.dateTime);
        return nextInterview >= startOfToday && nextInterview < endOfToday;
      }).length,
      next7DaysInterviews: assignedCandidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        if (!interviewData?.feedback?.[0]?.scheduled_event) return false;
        const nextInterview = new Date(interviewData.feedback[0].scheduled_event.start.dateTime);
        return nextInterview >= startOfToday && nextInterview < next7Days;
      }).length,
      highScoreCandidates: 0 // Not relevant for employee view
    };
    setStats(newStats);

    // Update pagination for filtered candidates
    setTotalPages(Math.ceil(assignedCandidates.length / itemsPerPage));
  }, [candidates, interviewCandidates, currentUser?.email, itemsPerPage]);

  const onCloseModal = () => {
    setSelectedCandidate(null);
  };

  // Filter to show only assigned candidates
  const assignedCandidates = candidates.filter(c => 
    interviewCandidates[c.id]?.feedback?.some(f => f.interviewer_email === currentUser?.email)
  );
  
  // Sort candidates
  const sortedCandidates = React.useMemo(() => {
    return [...assignedCandidates].sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = getNextInterview(interviewCandidates[a.id]?.feedback)?.getTime() || 0;
        const timeB = getNextInterview(interviewCandidates[b.id]?.feedback)?.getTime() || 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        const roundA = Number(interviewCandidates[a.id]?.completed_rounds || 0);
        const roundB = Number(interviewCandidates[b.id]?.completed_rounds || 0);
        return sortDirection === 'asc' ? roundA - roundB : roundB - roundA;
      }
    });
  }, [assignedCandidates, interviewCandidates, sortBy, sortDirection]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = sortedCandidates.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold">{stats.totalScheduled}</div>
            <div className="text-sm text-gray-600">My Total Scheduled</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold">{stats.todayInterviews}</div>
            <div className="text-sm text-gray-600">Today's Interviews</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold">{stats.next7DaysInterviews}</div>
            <div className="text-sm text-gray-600">Next 7 Days</div>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">My Assigned Candidates</h3>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'round')}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="time">Sort by Interview Time</option>
              <option value="round">Sort by Round</option>
            </select>
            <button
              onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {assignedCandidates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-2">No candidates assigned yet</div>
            <div className="text-sm text-gray-400">You will see candidates here once they are assigned to you</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Candidate</th>
                  <th className="text-left p-3">Experience</th>
                  <th className="text-left p-3">Technical Skills</th>
                  <th className="text-left p-3">Round</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Interview Time</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                        {candidate.total_experience_in_years}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {candidate.technical_skills?.split(',')?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {skill.trim()}
                          </span>
                        ))}
                        {candidate.technical_skills && candidate.technical_skills.split(',').length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs">
                            +{candidate.technical_skills.split(',').length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`}>
                        {interviewCandidates[candidate.id]?.status === 'completed'
                          ? `Round ${interviewCandidates[candidate.id]?.completed_rounds || '0'}`
                          : `Round ${(interviewCandidates[candidate.id]?.completed_rounds 
                              ? (Number(interviewCandidates[candidate.id].completed_rounds) || 0) 
                              : 0) + 1}`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        interviewCandidates[candidate.id]?.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : interviewCandidates[candidate.id]?.status === 'scheduled' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {interviewCandidates[candidate.id]?.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {(() => {
                        const interviewData = interviewCandidates[candidate.id];
                        const nextInterview = getNextInterview(interviewData?.feedback);
                        return nextInterview ? nextInterview.toLocaleString() : '-';
                      })()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSendReminder(candidate.id)}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Remind
                        </button>
                        <button
                          onClick={() => setSelectedCandidate(candidate)}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-4 px-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, assignedCandidates.length)} of {assignedCandidates.length} candidates
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Candidate Details
                </h2>
                <button
                  onClick={onCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <div className="font-medium">{selectedCandidate.name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <div className="font-medium">{selectedCandidate.email}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <div className="font-medium">{selectedCandidate.phone_no}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Experience</label>
                      <div className="font-medium">{selectedCandidate.total_experience_in_years}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Interview Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          interviewCandidates[selectedCandidate.id]?.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : interviewCandidates[selectedCandidate.id]?.status === 'scheduled' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {interviewCandidates[selectedCandidate.id]?.status || "Pending"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Total Interviews</label>
                      <div className="font-medium">
                        {interviewCandidates[selectedCandidate.id]?.no_of_interviews || '0'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Completed Rounds</label>
                      <div className="font-medium">
                        {interviewCandidates[selectedCandidate.id]?.completed_rounds || '0'}
                      </div>
                    </div>
                    {interviewCandidates[selectedCandidate.id]?.feedback?.[0]?.scheduled_event && (
                      <div>
                        <label className="text-sm text-gray-500">Next Interview</label>
                        <div className="font-medium">
                          {new Date(
                            interviewCandidates[selectedCandidate.id]?.feedback?.[0]?.scheduled_event?.start.dateTime || Date.now()
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Skills */}
              <div>
                <h3 className="text-lg font-medium mb-4">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.technical_skills?.split(',').map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interview Rounds */}
              {interviewCandidates[selectedCandidate.id]?.feedback
                ?.filter(f => f.interviewer_email === currentUser?.email)
                ?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Interview Rounds</h3>
                  <div className="space-y-4">
                    {interviewCandidates[selectedCandidate.id].feedback
                      .filter(f => f.interviewer_email === currentUser?.email)
                      .sort((a, b) => (a.round || 0) - (b.round || 0))
                      .map((feedback: CandidateFeedback, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <div>
                              <div className="font-medium">Round {feedback.round || idx + 1}</div>
                              <div className="text-sm text-gray-500">
                                {feedback.scheduled_event && new Date(feedback.scheduled_event.start.dateTime).toLocaleString()}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              feedback.isSelectedForNextRound === 'yes' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {feedback.isSelectedForNextRound === 'yes' ? 'Passed' : 'Not Passed'}
                            </span>
                          </div>
                          {feedback.feedback && (
                            <div className="text-sm text-gray-600 mt-2">
                              <div className="font-medium mb-1">Feedback:</div>
                              {feedback.feedback}
                            </div>
                          )}
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              {selectedCandidate.resume_url && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Resume</h3>
                  <a
                    href={selectedCandidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    View Resume <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="border-t pt-6 flex justify-end gap-3">
                <button
                  onClick={onCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpDashboard;