import React from "react";

interface InterviewStats {
  totalScheduled: number;
  pendingCandidates: number;
  upcomingInterviews: number;
  rescheduleRequests: number;
}

interface Manager {
  id: string;
  name: string;
  available: boolean;
}

interface Candidate {
  id: string;
  name: string;
  status: "pending" | "scheduled" | "completed";
  interviewTime?: string;
}

interface Props {
  stats: InterviewStats;
  managers: Manager[];
  candidates: Candidate[];
  onReschedule: (candidateId: string) => void;
  onSendReminder: (candidateId: string) => void;
}

const InterviewSchedulerDashboard: React.FC<Props> = ({
  stats,
  managers,
  candidates,
  onReschedule,
  onSendReminder,
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.totalScheduled}</div>
          <div className="text-sm text-gray-600">Scheduled Interviews</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.pendingCandidates}</div>
          <div className="text-sm text-gray-600">Pending Candidates</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.upcomingInterviews}</div>
          <div className="text-sm text-gray-600">Upcoming Interviews</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold">{stats.rescheduleRequests}</div>
          <div className="text-sm text-gray-600">Reschedule Requests</div>
        </div>
      </div>

      {/* Managers */}
      <div>
        <h3 className="font-semibold mb-2">Managers Availability</h3>
        <div className="flex flex-wrap gap-3">
          {managers.map((mgr) => (
            <div
              key={mgr.id}
              className={`px-4 py-2 rounded-lg border ${
                mgr.available
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {mgr.name}
            </div>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <div>
        <h3 className="font-semibold mb-2">Candidates</h3>
        <table className="min-w-full bg-white rounded-xl shadow-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Interview Time</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id}>
                <td className="p-2">{c.name}</td>
                <td className="p-2 capitalize">{c.status}</td>
                <td className="p-2">{c.interviewTime || "-"}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded"
                    onClick={() => onReschedule(c.id)}
                  >
                    Reschedule
                  </button>
                  <button
                    className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded"
                    onClick={() => onSendReminder(c.id)}
                  >
                    Send Reminder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InterviewSchedulerDashboard;