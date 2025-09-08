import React, { useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface UserSelectProps {
  users: User[];
  value: User | null;
  onChange: (user: User | null) => void;
  label?: string;
  placeholder?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export const UserSelect: React.FC<UserSelectProps> = ({
  users,
  value,
  onChange,
  label = "Assigner à",
  placeholder = "Sélectionner un membre...",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      )
    : users;

  return (
    <div className="w-full max-w-md relative">
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <button
        type="button"
        className="w-full border rounded px-3 py-2 flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen((o) => !o)}
        tabIndex={0}
      >
        {value ? (
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {getInitials(value.name)}
            </span>
            <span>
              <span className="font-semibold">{value.name}</span>
              <span className="text-xs text-gray-500 ml-1">({value.email})</span>
            </span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            className="w-full px-3 py-2 border-b focus:outline-none"
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-400">Aucun membre trouvé</div>
          )}
          {filtered.map((user) => (
            <button
              key={user._id}
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 ${
                value?._id === user._id ? "bg-blue-100" : ""
              }`}
              onClick={() => {
                onChange(user);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {getInitials(user.name)}
              </span>
              <span>
                <span className="font-semibold">{user.name}</span>
                <span className="text-xs text-gray-500 ml-1">({user.email})</span>
              </span>
              {value?._id === user._id && (
                <svg className="w-4 h-4 ml-auto text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 