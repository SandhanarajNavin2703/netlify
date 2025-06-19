import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { X, ChevronLeft, ChevronRight, Eye, ExternalLink } from 'lucide-react';
import StarRating from './StarRating';
import { addFeedbackToCandidate } from '../services/candidates.service';
import { onAuthChange } from '../services/auth.service';
import { getOrCreateUser, UserData } from '../services/user.service';

interface Job {
  id: string;
  job_role_name: string;
  job_description: string;
  years_of_experience_needed: string;
  location: string;
  status: 'open' | 'closed'; posted_date: Timestamp;
}

interface Manager {
  id: string;
  name: string;
  available: boolean;
}

interface Props {
  stats: {
    totalScheduled: number;
    pendingCandidates: number;
    upcomingInterviews: number;
    rescheduleRequests: number;
  };
  onReschedule: (candidateId: string) => void;
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
  round: number; // Add round number
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

const InterviewSchedulerDashboard: React.FC<Props> = ({
  onReschedule,
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

  const [feedback, setFeedback] = useState<{
    feedback: string;
    rating_out_of_10: number;
    isSelectedForNextRound: 'yes' | 'no';
  }>({
    feedback: '',
    rating_out_of_10: 0,
    isSelectedForNextRound: 'yes'
  });

  // Add user state
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

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

  const [managers, setManagers] = useState<Manager[]>([]);
  const candidatesTableRef = useRef<HTMLDivElement>(null);

  const scrollToCandidates = () => {
    candidatesTableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsMap, setJobsMap] = useState<Record<string, Job>>({});
  const [interviewCandidates, setInterviewCandidates] = useState<Record<string, InterviewCandidate>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch managers from interviewers collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'interviewers'), (snapshot) => {
      const managersData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        available: doc.data().available,
      }));
      setManagers(managersData);
    });
// addMockCandidatesToFirestore();
    return () => unsubscribe();
  }, []);

  // Fetch jobs from jobs collection
  useEffect(() => {
    const unsubscribeJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const jobsList: Job[] = [];
      const jobsMapping: Record<string, Job> = {};
      snapshot.forEach((doc) => {
        const job = { id: doc.id, ...doc.data() } as Job;
        jobsList.push(job);
        jobsMapping[doc.id] = job;
      });
      setJobs(jobsList);
      setJobsMap(jobsMapping);
    });

    return () => {
      unsubscribeJobs();
    };
  }, []);

  // Fetch interview candidates data
  useEffect(() => {
    const unsubscribeInterviews = onSnapshot(collection(db, 'interview_candidates'), (snapshot) => {
      const interviewData: Record<string, any> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        interviewData[data.candidate_id] = data;
      });
      setInterviewCandidates(interviewData);
    });

    return () => unsubscribeInterviews();
  }, []);

  // Calculate stats whenever candidates change
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const next7Days = new Date(startOfToday);
    next7Days.setDate(next7Days.getDate() + 7);

    const newStats = {
      totalScheduled: candidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        return interviewData?.feedback?.some(f => f.scheduled_event);
      }).length,
      pendingCandidates: candidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        return !interviewData?.feedback || interviewData.feedback.length === 0;
      }).length,
      upcomingInterviews: candidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        if (!interviewData?.feedback?.[0]?.scheduled_event) return false;
        const nextInterview = new Date(interviewData.feedback[0].scheduled_event.start.dateTime);
        return nextInterview > now;
      }).length,
      rescheduleRequests: candidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        if (!interviewData?.feedback) return false;
        const lastFeedback = interviewData.feedback[interviewData.feedback.length - 1];
        return lastFeedback?.isSelectedForNextRound === 'yes' && !interviewData.feedback[0]?.scheduled_event;
      }).length,
      todayInterviews: candidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        if (!interviewData?.feedback?.[0]?.scheduled_event) return false;
        const nextInterview = new Date(interviewData.feedback[0].scheduled_event.start.dateTime);
        return nextInterview >= startOfToday && nextInterview < endOfToday;
      }).length,
      next7DaysInterviews: candidates.filter(c => {
        const interviewData = interviewCandidates[c.id];
        if (!interviewData?.feedback?.[0]?.scheduled_event) return false;
        const nextInterview = new Date(interviewData.feedback[0].scheduled_event.start.dateTime);
        return nextInterview >= startOfToday && nextInterview < next7Days;
      }).length,
      highScoreCandidates: candidates.filter(c => parseInt(c.ai_fit_score) >= 20).length,
    };
    setStats(newStats);
  }, [candidates, interviewCandidates]);
  // Status updates are handled by the parent component

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = candidates.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setTotalPages(Math.ceil(candidates.length / itemsPerPage));
  }, [candidates, itemsPerPage]);

  const resetFeedbackForm = () => {
    setFeedback({
      feedback: '',
      rating_out_of_10: 0,
      isSelectedForNextRound: 'no'
    });
  };

  const onCloseModal = () => {
    setSelectedCandidate(null);
    resetFeedbackForm();
  };

  return (<div className="p-6 space-y-6 relative">
    {/* <div className="grid grid-cols-4 gap-4"> */}
    {/* Stats */}
    <div className="flex justify-between items-center mb-6">
      <div className="grid grid-cols-7 gap-4 flex-1">
        <div className="bg-blue-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.totalScheduled}</div>
          <div className="text-sm text-gray-600">Total Scheduled</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.pendingCandidates}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.todayInterviews}</div>
          <div className="text-sm text-gray-600">Today's Interviews</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.next7DaysInterviews}</div>
          <div className="text-sm text-gray-600">Next 7 Days</div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.upcomingInterviews}</div>
          <div className="text-sm text-gray-600">All Upcoming</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.rescheduleRequests}</div>
          <div className="text-sm text-gray-600">To Reschedule</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.highScoreCandidates}</div>
          <div className="text-sm text-gray-600">High AI Fit</div>
        </div>
      </div>
    </div>    {/* Jobs Section */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Open Positions</h3>
        <button
          onClick={scrollToCandidates}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          Show Candidates
        </button>
      </div>
      <div className="flex grid-cols-3 gap-4 mb-8" style={{width: "90vw", overflowX: "auto"}}>
        {jobs.filter(job => job.status === 'open').map((job) => (
          <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200" style={{minWidth: "380px"}}>
            <h4 className="flex font-semibold text-lg mb-2">{job.job_role_name}<p className="text-sm text-gray-700 mt-2 mx-2 line-clamp-2">({job.years_of_experience_needed} Years)</p></h4>
            <p className="text-sm text-gray-600 mb-2">{job.location || "Unknown Location"}</p>
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.job_description}</p>
          </div>
        ))}
      </div>
    </div>
    {/* </div> */}

    {/* Managers */}
    <div>
      <h3 className="font-semibold mb-2">Interviewers Availability</h3>
      <div className="flex flex-wrap gap-3">
        {managers.map((mgr) => (
          <div
            key={mgr.id}
            className={`px-4 py-2 rounded-lg border ${mgr.available
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
              }`}
          >
            {mgr.name || "Unknown"}
          </div>
        ))}
      </div>
    </div>

    {/* Candidates Table */}
    <div ref={candidatesTableRef}>
      <h3 className="font-semibold mb-2">Candidates</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm">
          <thead className="bg-gray-50">              <tr>
            <th className="text-left p-3">Candidate</th>
            <th className="text-left p-3">Position</th>
            <th className="text-left p-3">Experience</th>
            <th className="text-left p-3">Technical Skills</th>
            <th className="text-left p-3">Round Completed</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Interview Time</th>
            <th className="text-left p-3">AI Fit Score</th>
            <th className="text-left p-3">Actions</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentCandidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50">                  <td className="p-3">
                <div>
                  <div className="font-medium">{candidate.name}</div>
                  <div className="text-sm text-gray-500">{candidate.email}</div>
                </div>
              </td>
                <td className="p-3">
                  <div className="text-sm">
                    {jobsMap[candidate.job_id]?.job_role_name || 'N/A'}
                    <div className="text-xs text-gray-500">{jobsMap[candidate.job_id]?.location}</div>
                  </div>
                </td>
                <td className="p-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                    {candidate.total_experience_in_years}
                  </span>
                </td><td className="p-3">
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
                      ? "Round " + interviewCandidates[candidate.id]?.completed_rounds :
                      "Round " + (interviewCandidates[candidate.id]?.completed_rounds ? (parseInt(interviewCandidates[candidate.id]?.completed_rounds) + 1) : 1)}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${interviewCandidates[candidate.id]?.status === 'completed' ? 'bg-green-100 text-green-700' :
                      interviewCandidates[candidate.id]?.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
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
                  <span className={`px-2 py-1 rounded-full text-xs ${parseInt(candidate.ai_fit_score) >= 20 ? 'bg-green-100 text-green-700' :
                      parseInt(candidate.ai_fit_score) >= 15 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {candidate.ai_fit_score}%
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {/* <button
                        onClick={() => onReschedule(candidate.id)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Reschedule
                      </button> */}
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

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 px-4">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, candidates.length)} of {candidates.length} candidates
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded ${currentPage === number
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                  }`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
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
            </div>              <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <div className="font-medium">{selectedCandidate.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Position</label>
                    <div className="font-medium">{jobsMap[selectedCandidate.job_id]?.job_role_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">
                      {jobsMap[selectedCandidate.job_id]?.location}
                    </div>
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
                  <div>
                    <label className="text-sm text-gray-500">AI Fit Score</label>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm ${parseInt(selectedCandidate.ai_fit_score) >= 20 ? 'bg-green-100 text-green-700' :
                          parseInt(selectedCandidate.ai_fit_score) >= 15 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {selectedCandidate.ai_fit_score}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>                <div>
                <h3 className="text-lg font-medium mb-4">Interview Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs ${interviewCandidates[selectedCandidate.id]?.status === 'completed' ? 'bg-green-100 text-green-700' :
                          interviewCandidates[selectedCandidate.id]?.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
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
                        {new Date(interviewCandidates[selectedCandidate.id].feedback[0].scheduled_event.start.dateTime).toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  {/* Completed Rounds Review */}
                  {interviewCandidates[selectedCandidate.id]?.feedback && 
                   interviewCandidates[selectedCandidate.id].feedback.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-500 block mb-2">Rounds Review</label>
                      <div className="space-y-3">
                        {interviewCandidates[selectedCandidate.id].feedback.map((review, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-sm">Round {index + 1}</div>
                                <div className="text-xs text-gray-500">
                                  {review.interviewer_name || 'Unknown Interviewer'}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                review.isSelectedForNextRound === 'yes' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {review.isSelectedForNextRound === 'yes' ? 'Passed' : 'Not Passed'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              <div className="flex justify-between">
                                <span>Rating: <span className="text-yellow-600 font-medium">{review.rating_out_of_10}/10</span></span>
                                {review.scheduled_event && (
                                  <span className="text-gray-500">
                                    {new Date(review.scheduled_event.start.dateTime).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                              {review.feedback}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>              <div>
              <h3 className="text-lg font-medium mb-4">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.technical_skills?.split(',').map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>              {selectedCandidate.feedback && selectedCandidate.feedback.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Interview Feedback</h3>
                <div className="space-y-4">
                  {selectedCandidate.feedback.map((feedback, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="font-medium">{feedback.interviewer_name}</div>
                          <div className="text-sm text-gray-500">{feedback.interviewer_email}</div>
                        </div>
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-full ${feedback.isSelectedForNextRound === 'yes'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            {feedback.isSelectedForNextRound === 'yes' ? 'Selected' : 'Not Selected'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm">Rating:</div>
                          <div className="flex items-center">
                            <span className="text-yellow-500 font-medium">{feedback.rating_out_of_10}/10</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{feedback.feedback}</div>
                      </div>
                      {feedback.meet_link && (
                        <div className="mt-2">
                          <a
                            href={feedback.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            View Meeting Link <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      {feedback.scheduled_event && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-sm text-gray-500">Scheduled Time:</div>
                          <div className="text-sm">
                            {new Date(feedback.scheduled_event.start.dateTime).toLocaleString()} - {new Date(feedback.scheduled_event.end.dateTime).toLocaleTimeString()}
                          </div>
                          <a
                            href={feedback.scheduled_event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            View Calendar Event <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-4">Previous Companies</h3>
              <div className="space-y-4">
                {selectedCandidate.previous_companies.map((company, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.years}</div>
                    </div>
                    <div className="text-sm text-gray-600">{company.job_responsibilities}</div>
                  </div>
                ))}
              </div>
            </div>

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

            {/* Add Feedback Form */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Add Feedback</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <StarRating 
                    label="" 
                    onChange={(rating) => setFeedback(prev => ({...prev, rating_out_of_10: rating || 0}))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    value={feedback.feedback}
                    onChange={(e) => setFeedback(prev => ({...prev, feedback: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter your feedback about the candidate..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select for Next Round
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="isSelectedForNextRound"
                        value="yes"
                        checked={feedback.isSelectedForNextRound === 'yes'}
                        onChange={(e) => setFeedback(prev => ({
                          ...prev,
                          isSelectedForNextRound: e.target.value as 'yes' | 'no'
                        }))}
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="isSelectedForNextRound"
                        value="no"
                        checked={feedback.isSelectedForNextRound === 'no'}
                        onChange={(e) => setFeedback(prev => ({
                          ...prev,
                          isSelectedForNextRound: e.target.value as 'yes' | 'no'
                        }))}
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>
              </div>              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  disabled={!feedback.feedback || !feedback.rating_out_of_10 || !currentUser}
                  onClick={async () => {
                    if (!selectedCandidate || !currentUser) return;

                    try {
                      // Get the current completed rounds
                      const currentRounds = interviewCandidates[selectedCandidate.id]?.completed_rounds;
                      
                      // Add the feedback with the correct round number
                      await addFeedbackToCandidate(selectedCandidate.id, currentRounds || "0", {
                        feedback: feedback.feedback,
                        rating_out_of_10: feedback.rating_out_of_10*2,
                        isSelectedForNextRound: feedback.isSelectedForNextRound,
                        interviewer_name: currentUser.name || currentUser.email,
                        interviewer_email: currentUser.email,
                      });
                      
                      alert('Feedback submitted successfully');
                      onCloseModal();
                    } catch (error) {
                      console.error('Error submitting feedback:', error);
                      alert('Error submitting feedback');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${!feedback.feedback || !feedback.rating_out_of_10 || !currentUser
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Submit Feedback
                </button>
                <button
                  onClick={onCloseModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default InterviewSchedulerDashboard;