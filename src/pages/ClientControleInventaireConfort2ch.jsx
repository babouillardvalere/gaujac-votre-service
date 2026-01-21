import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ClientControleInventaireConfort2ch() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(createPageUrl('ClientControleInventaire'), { replace: true });
  }, [navigate]);
  
  return null;
}