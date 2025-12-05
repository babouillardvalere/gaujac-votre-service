import ChoixLangue from './pages/ChoixLangue';
import Home from './pages/Home';
import IdentiteClient from './pages/IdentiteClient';
import ChoixHebergement from './pages/ChoixHebergement';
import Signalement from './pages/Signalement';
import Collaborateur from './pages/Collaborateur';
import CollaborateurTechnique from './pages/CollaborateurTechnique';
import CollaborateurMenage from './pages/CollaborateurMenage';
import Bureau from './pages/Bureau';
import Avis from './pages/Avis';
import SignalementClient from './pages/SignalementClient';
import Intervention from './pages/Intervention';
import Dashboard from './pages/Dashboard';
import Piscine from './pages/Piscine';
import SatisfactionClient from './pages/SatisfactionClient';
import MenuCollaborateur from './pages/MenuCollaborateur';
import Technique from './pages/Technique';
import Menage from './pages/Menage';
import ConditionsClient from './pages/ConditionsClient';
import Attente from './pages/Attente';
import Materiel from './pages/Materiel';
import SuiviIntervention from './pages/SuiviIntervention';
import AvisIdentification from './pages/AvisIdentification';
import AvisFormulaire from './pages/AvisFormulaire';
import MeilleursAvis from './pages/MeilleursAvis';
import Taches from './pages/Taches';
import ClientMenu from './pages/ClientMenu';
import ClientArrivee from './pages/ClientArrivee';
import ClientDepart from './pages/ClientDepart';
import ClientDepartIdentite from './pages/ClientDepartIdentite';
import ClientDepartHebergement from './pages/ClientDepartHebergement';
import ClientDepartChecklist from './pages/ClientDepartChecklist';
import ClientDepartPhotos from './pages/ClientDepartPhotos';
import ClientDepartConfirmation from './pages/ClientDepartConfirmation';
import ClientArriveeIdentite from './pages/ClientArriveeIdentite';
import ClientArriveeHebergement from './pages/ClientArriveeHebergement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ChoixLangue": ChoixLangue,
    "Home": Home,
    "IdentiteClient": IdentiteClient,
    "ChoixHebergement": ChoixHebergement,
    "Signalement": Signalement,
    "Collaborateur": Collaborateur,
    "CollaborateurTechnique": CollaborateurTechnique,
    "CollaborateurMenage": CollaborateurMenage,
    "Bureau": Bureau,
    "Avis": Avis,
    "SignalementClient": SignalementClient,
    "Intervention": Intervention,
    "Dashboard": Dashboard,
    "Piscine": Piscine,
    "SatisfactionClient": SatisfactionClient,
    "MenuCollaborateur": MenuCollaborateur,
    "Technique": Technique,
    "Menage": Menage,
    "ConditionsClient": ConditionsClient,
    "Attente": Attente,
    "Materiel": Materiel,
    "SuiviIntervention": SuiviIntervention,
    "AvisIdentification": AvisIdentification,
    "AvisFormulaire": AvisFormulaire,
    "MeilleursAvis": MeilleursAvis,
    "Taches": Taches,
    "ClientMenu": ClientMenu,
    "ClientArrivee": ClientArrivee,
    "ClientDepart": ClientDepart,
    "ClientDepartIdentite": ClientDepartIdentite,
    "ClientDepartHebergement": ClientDepartHebergement,
    "ClientDepartChecklist": ClientDepartChecklist,
    "ClientDepartPhotos": ClientDepartPhotos,
    "ClientDepartConfirmation": ClientDepartConfirmation,
    "ClientArriveeIdentite": ClientArriveeIdentite,
    "ClientArriveeHebergement": ClientArriveeHebergement,
}

export const pagesConfig = {
    mainPage: "ChoixLangue",
    Pages: PAGES,
    Layout: __Layout,
};