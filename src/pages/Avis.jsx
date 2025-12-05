import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

// Cette page redirige vers AvisIdentification
export default function Avis() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('AvisIdentification'));
  }, [navigate]);

  return null;
}