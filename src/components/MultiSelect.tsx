import React, { useState, useRef, useEffect } from "react";

interface Candidate {
  id: string;
  candidate_name: string;
}

interface MultiSelectDropdownProps {
  label?: string;
  options: Candidate[];
  onChange?: (selectedIds: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label = "Select Candidates",
  options,
  onChange,
  placeholder = "Select candidate(s)",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (id: string) => {
    let updatedSelected: string[];

    if (selectedIds.includes(id)) {
      updatedSelected = selectedIds.filter((item) => item !== id);
    } else {
      updatedSelected = [...selectedIds, id];
    }

    setSelectedIds(updatedSelected);
    if (onChange) onChange(updatedSelected);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get candidate names from selected IDs
  const selectedNames = options
    .filter((opt) => selectedIds.includes(opt.id))
    .map((opt) => opt.candidate_name);

  return (
    <div className="w-full max-w-md mx-auto">
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={toggleDropdown}
          className="cursor-pointer w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm flex justify-between items-center"
        >
          <span className="text-gray-700 text-sm">
            {selectedNames.length > 0 ? selectedNames.join(", ") : placeholder}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 9l-7 7-7-7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => handleSelect(option.id)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  {option.candidate_name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;
