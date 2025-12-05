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
}

export const pagesConfig = {
    mainPage: "ChoixLangue",
    Pages: PAGES,
    Layout: __Layout,
};