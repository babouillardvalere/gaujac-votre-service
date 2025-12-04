import React from 'react';

export default function Logo({ className = "h-16" }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png"
        alt="Camping Paradis - Domaine de Gaujac"
        className="h-full w-auto object-contain"
      />
    </div>
  );
}