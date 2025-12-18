import React, { useState, useEffect, useRef } from 'react';

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(hours + 'h');
  if (minutes > 0) parts.push(minutes + 'min');
  if (seconds >= 0) parts.push(seconds + 's');
  if (parts.length === 0) parts.push('0s');
  return parts.join(' ');
}

function Technique() {
  // État principal de l'intervention technique
  const [status, setStatus] = useState('en_attente');
  const [collaboratorName, setCollaboratorName] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [events, setEvents] = useState([]);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [holdDelay, setHoldDelay] = useState('');
  const [holdComment, setHoldComment] = useState('');
  const [notifications, setNotifications] = useState(0);

  // Exemple de titre/description d'intervention (à adapter en pratique avec les données réelles)
  const interventionTitle = "Panne de climatisation - Chambre 210";

  // Démarrer l'intervention (passe de en_attente à en_cours)
  const startIntervention = () => {
    if (!collaboratorName) {
      alert("Veuillez renseigner le nom du collaborateur avant de démarrer.");
      return;
    }
    setStatus('en_cours');
    setStartTime(Date.now());
    // Créer un événement de prise en charge
    const event = {
      status: 'en_cours',
      message: `Intervention prise en charge par ${collaboratorName}`,
      time: new Date()
    };
    setEvents(prev => [...prev, event]);
    // TODO: synchroniser cet événement avec la timeline client (appel API ou WebSocket)
  };

  // Clôturer l'intervention (passe de en_cours/en_attente_materiel à resolu)
  const finishIntervention = () => {
    setStatus('resolu');
    const finishTime = Date.now();
    setEndTime(finishTime);
    // Calculer la durée totale écoulée
    const totalDuration = finishTime - startTime;
    const durationStr = formatDuration(totalDuration);
    // Créer un événement de résolution avec la durée
    const event = {
      status: 'resolu',
      message: `Intervention résolue par ${collaboratorName} (durée : ${durationStr})`,
      time: new Date()
    };
    setEvents(prev => [...prev, event]);
    // TODO: synchroniser la résolution avec la timeline client (mettre à jour le suivi client)
  };

  // Ouvrir le formulaire de mise en attente
  const openHoldForm = () => {
    setShowHoldForm(true);
    setHoldReason('');
    setHoldDelay('');
    setHoldComment('');
  };

  // Confirmer la mise en attente (passe de en_cours à en_attente_materiel)
  const confirmHold = () => {
    if (!holdReason || !holdDelay) {
      alert("Veuillez indiquer un motif et un délai estimé pour la mise en attente.");
      return;
    }
    setStatus('en_attente_materiel');
    setShowHoldForm(false);
    // Créer un événement de mise en attente avec motif et délai
    const event = {
      status: 'en_attente_materiel',
      message: `Intervention mise en attente - ${holdReason} (Reprise estimée : ${holdDelay})`,
      time: new Date()
    };
    setEvents(prev => [...prev, event]);
    // TODO: synchroniser cet événement avec la timeline client
  };

  // Reprendre l'intervention (passe de en_attente_materiel à en_cours)
  const resumeIntervention = () => {
    setStatus('en_cours');
    // Créer un événement de reprise
    const event = { status: 'en_cours', message: "Intervention reprise", time: new Date() };
    setEvents(prev => [...prev, event]);
    // TODO: synchronisation client si nécessaire
  };

  // Gestion des ajouts de photos avant/après (conversion en URL locales pour aperçu)
  const handleAddBeforePhotos = (files) => {
    const newPhotos = files.map(file => ({
      file,
      url: URL.createObjectURL(file)  // crée une URL utilisable pour afficher le fichier
    }));
    setBeforePhotos(prev => [...prev, ...newPhotos]);
  };
  const handleAddAfterPhotos = (files) => {
    const newPhotos = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setAfterPhotos(prev => [...prev, ...newPhotos]);
  };

  return (
    <div className="intervention-page">
      {/* En-tête avec titre de la page et icône de notification */}
      <header className="header">
        <h1>Intervention Technique</h1>
        <CollaborateurNotificationBell count={notifications} />
      </header>

      {/* Titre/description de l'intervention en cours */}
      <h2>{interventionTitle}</h2>

      {/* Section statut + collaborateur + timer */}
      <div className="status-section">
        <StatusBadge status={status} />
        {status !== 'en_attente' && collaboratorName && (
          <span className="collab-name">Collaborateur : {collaboratorName}</span>
        )}
        {status !== 'en_attente' && (
          <InterventionTimer status={status} startTime={startTime} endTime={endTime} />
        )}
      </div>

      {/* Formulaire de démarrage (visible seulement si en_attente) */}
      {status === 'en_attente' && (
        <div className="start-section">
          <label>
            Nom du collaborateur :
            <input
              type="text"
              value={collaboratorName}
              onChange={(e) => setCollaboratorName(e.target.value)}
            />
          </label>
          <button onClick={startIntervention}>Commencer l'intervention</button>
        </div>
      )}

      {/* Boutons d'actions en cours d'intervention */}
      {status === 'en_cours' && (
        <div className="actions-section">
          <button onClick={openHoldForm}>Mettre en attente</button>
          <button onClick={finishIntervention}>Clôturer l'intervention</button>
        </div>
      )}

      {/* Boutons d'actions en attente (pause) */}
      {status === 'en_attente_materiel' && (
        <div className="actions-section">
          <button onClick={resumeIntervention}>Reprendre l'intervention</button>
          <button onClick={finishIntervention}>Clôturer l'intervention</button>
        </div>
      )}

      {/* Formulaire de mise en attente (motif, délai, commentaire) */}
      {showHoldForm && (
        <div className="hold-form">
          <h3>Mettre en attente</h3>
          <div>
            <label>Motif :
              <input
                type="text"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>Délai estimé :
              <input
                type="text"
                value={holdDelay}
                onChange={(e) => setHoldDelay(e.target.value)}
                placeholder="par ex : 2 heures, demain midi..."
              />
            </label>
          </div>
          <div>
            <label>Commentaire interne :
              <textarea
                value={holdComment}
                onChange={(e) => setHoldComment(e.target.value)}
              />
            </label>
          </div>
          <button onClick={confirmHold}>Confirmer</button>
          <button onClick={() => setShowHoldForm(false)}>Annuler</button>
        </div>
      )}

      {/* Section des photos avant/après (s'affiche une fois l'intervention commencée) */}
      {(status === 'en_cours' || status === 'en_attente_materiel' || status === 'resolu') && (
        <div className="photos-section">
          <div className="photo-column">
            <h3>Photos avant intervention</h3>
            {status !== 'resolu' && (
              <PhotoInterventionCapture label="Ajouter une photo" onCapture={handleAddBeforePhotos} />
            )}
            <div className="photo-list">
              {beforePhotos.map((photo, idx) => (
                <img 
                  key={idx}
                  src={photo.url}
                  alt={`Avant ${idx + 1}`}
                  className="photo-thumb"
                />
              ))}
            </div>
          </div>
          <div className="photo-column">
            <h3>Photos après intervention</h3>
            {status !== 'resolu' && (
              <PhotoInterventionCapture label="Ajouter une photo" onCapture={handleAddAfterPhotos} />
            )}
            <div className="photo-list">
              {afterPhotos.map((photo, idx) => (
                <img 
                  key={idx}
                  src={photo.url}
                  alt={`Après ${idx + 1}`}
                  className="photo-thumb"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historique des événements de l'intervention */}
      <div className="events-section">
        <h3>Historique des événements</h3>
        <ul>
          {events.map((event, idx) => (
            <li key={idx}>
              <span>[{new Date(event.time).toLocaleString('fr-FR')}]</span> {event.message}
            </li>
          ))}
        </ul>
      </div>

      {/* Styles CSS (inclus dans le composant pour simplicité) */}
      <style jsx>{`
        .header { display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 1.5em; margin: 0.5em 0; }
        .status-section { margin: 1em 0; display: flex; align-items: center; }
        .collab-name { margin-left: 1em; font-weight: bold; }
        .start-section, .actions-section, .hold-form { margin: 1em 0; }
        .actions-section button { margin-right: 0.5em; }
        .hold-form label { display: block; margin-bottom: 0.5em; }
        .photos-section { display: flex; flex-wrap: wrap; gap: 1em; margin: 1em 0; }
        .photo-column { flex: 1 1 300px; }
        .photo-list img.photo-thumb { max-width: 100%; height: auto; display: block; margin: 0.5em 0; border: 1px solid #ccc; }
        .events-section { margin: 1em 0; }
        .events-section ul { padding-left: 1.2em; }
        .events-section li { margin-bottom: 0.5em; list-style: disc; }
        /* Badges de statut */
        .badge { display: inline-block; padding: 0.2em 0.6em; border-radius: 0.25em; font-size: 0.9em; font-weight: bold; color: #fff; }
        .badge-waiting { background-color: #6c757d; }    /* gris pour En attente */
        .badge-in-progress { background-color: #007bff; } /* bleu pour En cours */
        .badge-paused { background-color: #ff9800; }     /* orange pour Attente (pause) */
        .badge-resolved { background-color: #28a745; }   /* vert pour Résolu */
      `}</style>
    </div>
  );
}

// Composant Timer pour afficher le temps écoulé
function InterventionTimer({ status, startTime, endTime }) {
  const [elapsed, setElapsed] = useState(0);

  // Mettre à jour le timer toutes les secondes tant que l'intervention n'est pas résolue
  useEffect(() => {
    let intervalId;
    if (status === 'en_cours' || status === 'en_attente_materiel') {
      intervalId = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    }
    // Nettoyage de l'intervalle à chaque changement de status ou démontage du composant
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, startTime]);

  // Lorsque l'intervention est terminée, fixer le temps écoulé final
  useEffect(() => {
    if (status === 'resolu' && startTime && endTime) {
      setElapsed(endTime - startTime);
    }
  }, [status, startTime, endTime]);

  // Formater le temps écoulé en hh/min/s
  const formatted = startTime ? formatDuration(elapsed) : '0s';
  return <span className="timer">⏱️ {formatted}</span>;
}

// Composant pour capture de photo (input fichier avec capture caméra)
function PhotoInterventionCapture({ label, onCapture }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onCapture(files);
    }
    // Réinitialiser la valeur pour pouvoir reprendre une photo identique si besoin
    e.target.value = '';
  };

  return (
    <div className="photo-capture">
      <button type="button" onClick={() => fileInputRef.current?.click()}>
        {label || "Prendre une photo"}
      </button>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        ref={fileInputRef}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// Composant Badge de statut (affiche le libellé et la couleur du statut)
function StatusBadge({ status }) {
  let label = '';
  let className = '';
  switch (status) {
    case 'en_attente':
      label = 'En attente';
      className = 'badge-waiting';
      break;
    case 'en_cours':
      label = 'En cours';
      className = 'badge-in-progress';
      break;
    case 'en_attente_materiel':
      label = 'Attente';
      className = 'badge-paused';
      break;
    case 'resolu':
      label = 'Résolu';
      className = 'badge-resolved';
      break;
    default:
      label = status;
      className = 'badge-waiting';
  }
  return <span className={`badge ${className}`}>{label}</span>;
}

// Icône de notification pour le collaborateur (simple cloche avec compteur)
function CollaborateurNotificationBell({ count }) {
  return (
    <div className="notification-bell" style={{ position: 'relative', display: 'inline-block' }}>
      <span role="img" aria-label="Notifications">🔔</span>
      {count > 0 && (
        <span className="notif-count" style={{
          position: 'absolute',
          top: '-5px', right: '-5px',
          background: 'red', color: 'white',
          borderRadius: '50%', padding: '2px 5px',
          fontSize: '0.8em'
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

export default Technique;