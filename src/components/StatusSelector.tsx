// components/StatusSelector.tsx
import React, { useState } from "react";

interface StatusSelectorProps {
  label?: string;
  options?: string[]; // dynamic options like ['Selected', 'Not Selected', ...]
  onStatusChange?: (status: string) => void;
  onCommentChange?: (comment: string) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  label = "Status",
  options = ["Selected", "Not Selected"],
  onStatusChange,
  onCommentChange,
}) => {
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComment = e.target.value;
    setComment(newComment);
    if (onCommentChange) onCommentChange(newComment);
  };

  return (
    <div className="space-y-4">
      {/* Dropdown */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          value={status}
          onChange={handleStatusChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">-- Select Status --</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Textarea */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Comments
        </label>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          rows={4}
          placeholder="Enter comments..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        ></textarea>
      </div>
    </div>
  );
};

export default StatusSelector;
