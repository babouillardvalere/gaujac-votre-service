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

function Menage() {
  // État principal de l'intervention de ménage
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

  // Exemple de titre pour une intervention de ménage
  const interventionTitle = "Nettoyage de la suite 312 après départ client";

  // Démarrer l'intervention
  const startIntervention = () => {
    if (!collaboratorName) {
      alert("Veuillez renseigner le nom du collaborateur avant de démarrer.");
      return;
    }
    setStatus('en_cours');
    setStartTime(Date.now());
    const event = {
      status: 'en_cours',
      message: `Intervention prise en charge par ${collaboratorName}`,
      time: new Date()
    };
    setEvents(prev => [...prev, event]);
    // TODO: notifier le système client de la prise en charge
  };

  // Clôturer l'intervention
  const finishIntervention = () => {
    setStatus('resolu');
    const finishTime = Date.now();
    setEndTime(finishTime);
    const totalDuration = finishTime - startTime;
    const durationStr = formatDuration(totalDuration);
    const event = {
      status: 'resolu',
      message: `Intervention résolue par ${collaboratorName} (durée : ${durationStr})`,
      time: new Date()
    };
    setEvents(prev => [...prev, event]);
    // TODO: notifier la timeline client de la résolution
  };

  // Ouvrir formulaire d'attente
  const openHoldForm = () => {
    setShowHoldForm(true);
    setHoldReason('');
    setHoldDelay('');
    setHoldComment('');
  };

  // Confirmer la mise en attente
  const confirmHold = () => {
    if (!holdReason || !holdDelay) {
      alert("Veuillez indiquer un motif et un délai estimé pour la mise en attente.");
      return;
    }
    setStatus('en_attente_materiel');
    setShowHoldForm(false);
    const event = {
      status: 'en_attente_materiel',
      message: `Intervention mise en attente - ${holdReason} (Reprise estimée : ${holdDelay})`,
      time: new Date()
    };
    setEvents(prev => [...prev, event]);
    // TODO: notifier la timeline client de la mise en attente
  };

  // Reprendre l'intervention
  const resumeIntervention = () => {
    setStatus('en_cours');
    const event = { status: 'en_cours', message: "Intervention reprise", time: new Date() };
    setEvents(prev => [...prev, event]);
    // TODO: notifier le client de la reprise
  };

  // Gestion des ajouts de photos
  const handleAddBeforePhotos = (files) => {
    const newPhotos = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
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
      <header className="header">
        <h1>Intervention Ménage</h1>
        <CollaborateurNotificationBell count={notifications} />
      </header>

      <h2>{interventionTitle}</h2>

      <div className="status-section">
        <StatusBadge status={status} />
        {status !== 'en_attente' && collaboratorName && (
          <span className="collab-name">Collaborateur : {collaboratorName}</span>
        )}
        {status !== 'en_attente' && (
          <InterventionTimer status={status} startTime={startTime} endTime={endTime} />
        )}
      </div>

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

      {status === 'en_cours' && (
        <div className="actions-section">
          <button onClick={openHoldForm}>Mettre en attente</button>
          <button onClick={finishIntervention}>Clôturer l'intervention</button>
        </div>
      )}

      {status === 'en_attente_materiel' && (
        <div className="actions-section">
          <button onClick={resumeIntervention}>Reprendre l'intervention</button>
          <button onClick={finishIntervention}>Clôturer l'intervention</button>
        </div>
      )}

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
                placeholder="par ex : 2 heures, cet après-midi..."
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
        .badge { display: inline-block; padding: 0.2em 0.6em; border-radius: 0.25em; font-size: 0.9em; font-weight: bold; color: #fff; }
        .badge-waiting { background-color: #6c757d; }
        .badge-in-progress { background-color: #007bff; }
        .badge-paused { background-color: #ff9800; }
        .badge-resolved { background-color: #28a745; }
      `}</style>
    </div>
  );
}

// Les composants utilitaires sont identiques à ceux de Technique.jsx
function InterventionTimer({ status, startTime, endTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let intervalId;
    if (status === 'en_cours' || status === 'en_attente_materiel') {
      intervalId = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [status, startTime]);
  useEffect(() => {
    if (status === 'resolu' && startTime && endTime) {
      setElapsed(endTime - startTime);
    }
  }, [status, startTime, endTime]);
  const formatted = startTime ? formatDuration(elapsed) : '0s';
  return <span className="timer">⏱️ {formatted}</span>;
}

function PhotoInterventionCapture({ label, onCapture }) {
  const fileInputRef = useRef(null);
  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onCapture(files);
    }
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

export default Menage;