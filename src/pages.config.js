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
}

export const pagesConfig = {
    mainPage: "ChoixLangue",
    Pages: PAGES,
};