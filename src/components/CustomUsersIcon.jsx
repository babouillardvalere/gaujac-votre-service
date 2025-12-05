import React from 'react';

export default function CustomUsersIcon({ className = "w-7 h-7" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="7" r="3" fill="#FFD700" stroke="#000000" strokeWidth="1.5" />
      <circle cx="15" cy="7" r="3" fill="#FFD700" stroke="#000000" strokeWidth="1.5" />
      <path d="M3 20C3 16.6863 5.68629 14 9 14C12.3137 14 15 16.6863 15 20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 20C9 16.6863 11.6863 14 15 14C18.3137 14 21 16.6863 21 20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}