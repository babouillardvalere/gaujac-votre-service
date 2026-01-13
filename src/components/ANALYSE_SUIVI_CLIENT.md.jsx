# 👤 ANALYSE SUIVI CLIENT - VALIDATION EXHAUSTIVE

**Date** : 13 janvier 2026  
**Analyste** : Base44 AI  
**Flux analysé** : SUIVI INTERVENTIONS CÔTÉ CLIENT

---

## 🎯 OBJECTIF MÉTIER

Permettre au client de suivre EN TEMPS RÉEL toutes les interventions :
1. Créées lors du contrôle inventaire ARRIVÉE
2. Créées pendant le séjour (signalements)

**Exigences fonctionnelles** :
- ✅ Affichage UNIQUEMENT des interventions du client
- ✅ Statut compréhensible (En attente / En cours / Résolu)
- ✅ Service responsable visible (TECHNIQUE / MENAGE)
- ❌ AUCUNE information interne (commentaires collaborateurs, WorkItems bruts)
- ❌ AUCUN doublon

---

## 📊 ARCHITECTURE ACTUELLE

### Entités utilisées pour le suivi client

```
1. Incident (signalements directs pendant séjour)
   ↓
2. InterventionEvent (timeline visible client)
   ↓
3. SuiviInventaire (suivi consolidé arrivée)
   - statut_menage
   - statut_technique
   - timeline_menage[]
   - timeline_technique[]
   - items_menage[]
   - items_technique[]
```

### Flux de données actuels

```
┌──────────────────────────┐
│  CLIENT CONTRÔLE ARRIVÉE │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│  InterventionClient      │  ← Conteneur logique
│  + WorkItem              │  ← Tâches services
└──────────┬───────────────┘
           ↓
     ❓ SuiviInventaire créé ?
     ❓ Lien InterventionClient → SuiviInventaire ?
     ❓ Mise à jour temps réel ?

┌──────────────────────────┐
│  CLIENT SIGNALEMENT      │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│  Incident                │  ← Signalement direct
└──────────┬───────────────┘
           ↓
     ✅ InterventionEvent créés (visible_client: true)
     ❓ SuiviInventaire créé aussi ?
```

---

## 🔍 ANALYSE PAR PAGE

### 📱 Page 1 : `pages/SuiviIntervention.jsx`

**Objectif** : Suivi interventions par sélection hébergement

#### Récupération données (L124-151)

**📍 CODE EXACT** :
```javascript
const { data: incidents = [], isLoading } = useQuery({
  queryKey: ['suivi-incidents', userData.stayId, selectedNumero],
  queryFn: async () => {
    // Tentative 1 : par stay_id
    if (userData.stayId) {
      const byStay = await base44.entities.Incident.filter(
        { stay_id: userData.stayId },
        '-date_saisie',
        200
      );
      if (byStay.length) return byStay;
    }

    // Tentative 2 : par logement + nom client
    if (!selectedNumero || !userData.nom || !userData.prenom) return [];

    const field = hebergementType === 'emplacement' ? 'emplacement' : 'logement';
    const byLogement = await base44.entities.Incident.filter(
      { [field]: selectedNumero },
      '-date_saisie',
      100
    );

    return byLogement.filter(i =>
      i.client_nom?.toLowerCase() === userData.nom.toLowerCase() &&
      i.client_prenom?.toLowerCase() === userData.prenom.toLowerCase()
    );
  },
  enabled: step === 'suivi'
});
```

**🔴 PROBLÈMES DÉTECTÉS** :

#### Problème A : Source de données UNIQUEMENT `Incident`

**Impact** :
- ❌ Lit UNIQUEMENT `Incident` (signalements directs pendant séjour)
- ❌ NE LIT PAS `InterventionClient` (créées lors de l'arrivée)
- ❌ NE LIT PAS `WorkItem` (tâches services)
- ❌ NE LIT PAS `SuiviInventaire` (suivi consolidé)

**Conséquence** :
```
Scénario arrivée :
- Client valide inventaire avec 2 assiettes manquantes (MENAGE) + 1 lit cassé (TECHNIQUE)
- Système crée InterventionClient + WorkItem pour chaque service
- Client va dans "Suivi intervention"
- RÉSULTAT : ❌ Liste vide (ne voit PAS les interventions arrivée)
```

#### Problème B : Dépendance à `stay_id`

**Code** (L127-133) :
```javascript
if (userData.stayId) {
  const byStay = await base44.entities.Incident.filter(
    { stay_id: userData.stayId },
    '-date_saisie',
    200
  );
  if (byStay.length) return byStay;
}
```

**Question critique** : Le `stay_id` est-il attribué aux InterventionClient/WorkItem créés lors de l'arrivée ?

**Vérification dans ClientControleInventaire.jsx** (L205-221) :
```javascript
const interventionClient = await base44.entities.InterventionClient.create({
  type_intervention: "INVENTAIRE_ARRIVEE",
  type_hebergement: categorie,
  numero_hebergement: numero,
  client_nom: nom,
  client_prenom: prenom,
  date_arrivee: dateArrivee,
  date_depart: dateDepart,
  service,
  priorite: hasUrgent ? "URGENTE" : "NORMALE",
  description: descriptionComplete,
  taches,
  statut: "A_FAIRE",
  autorisation_acces: autorisationAcces,
  plages_horaires: autorisationAcces === 'non' ? plagesHoraires : [],
  fiche_arrivee_id: ficheId
  // ❌ PAS DE stay_id ici !
});
```

**🔴 CONFIRMATION** : Les InterventionClient créées lors de l'arrivée N'ONT PAS de `stay_id`.

**Impact** :
- ❌ Le filtre `stay_id` ne fonctionnera JAMAIS pour les interventions arrivée
- ❌ Même avec un `stay_id` valide en session, les interventions arrivée sont invisibles

---

### 📱 Page 2 : `pages/ClientSuiviInventaire.jsx`

**Objectif** : Suivi interventions arrivée via recherche nom/prénom

#### Récupération données (L71-108)

**📍 CODE EXACT** :
```javascript
const { data: suivis = [], isLoading, refetch } = useQuery({
  queryKey: ['suivis-inventaire', searchTriggered, search, filters.dateDebut, filters.dateFin],
  queryFn: async () => {
    if (!searchTriggered) return [];
    
    // Récupérer tous les suivis
    const allSuivis = await base44.entities.SuiviInventaire.list('-created_date', 200);
    
    // Filtrer par nom/prénom avec recherche flexible
    const searchLower = search.toLowerCase().trim();
    const filtered = allSuivis.filter(s => {
      const nomComplet = `${s.client_prenom || ''} ${s.client_nom || ''}`.toLowerCase();
      const nomInverse = `${s.client_nom || ''} ${s.client_prenom || ''}`.toLowerCase();
      
      const matchNom = !search || 
                      nomComplet.includes(searchLower) ||
                      nomInverse.includes(searchLower) ||
                      s.client_nom?.toLowerCase().includes(searchLower) ||
                      s.client_prenom?.toLowerCase().includes(searchLower);
      
      // Vérifier dates de séjour
      const matchDates = !filters.dateDebut && !filters.dateFin ? true :
                        (!filters.dateDebut || !s.date_arrivee || s.date_arrivee <= filters.dateFin) &&
                        (!filters.dateFin || !s.date_depart || s.date_depart >= filters.dateDebut);
      
      return matchNom && matchDates;
    });
    
    return filtered;
  },
  enabled: searchTriggered
});
```

**✅ POINTS POSITIFS** :
- ✅ Lit l'entité `SuiviInventaire` (conçue pour le suivi client)
- ✅ Filtre par nom/prénom client
- ✅ Affiche `items_menage` et `items_technique`
- ✅ Affiche `statut_menage` et `statut_technique`

**🔴 PROBLÈME CRITIQUE** :

#### Problème C : SuiviInventaire NON créé lors de l'arrivée

**Vérification dans ClientControleInventaire.jsx** (L668-908) :

**Entités créées lors de la validation inventaire** :
1. ✅ `FicheArrivee` (L699-715)
2. ✅ `InterventionClient` (L205-221, fonction createIntervention)
3. ✅ `WorkItem` (L234-253, fonction createIntervention)
4. ✅ `Notification` (L269-289)
5. ✅ `HistoriqueEvent` (L813-831)
6. ❌ **`SuiviInventaire` : ABSENT**

**🔴 CONCLUSION** : L'entité `SuiviInventaire` n'est JAMAIS créée lors de l'arrivée.

**Impact** :
- ❌ `ClientSuiviInventaire.jsx` ne trouvera JAMAIS de suivi pour les arrivées
- ❌ La timeline ne sera jamais alimentée
- ❌ Les statuts `statut_menage` / `statut_technique` ne seront jamais mis à jour

**Exception** : Le module `syncSuiviInventaire.jsx` existe (L1-220) avec fonction `createSuiviFromIncident()`, MAIS :
- ⚠️ N'est jamais appelé dans le code de création InterventionClient
- ⚠️ Conçu pour Incident (signalements), pas pour InterventionClient/WorkItem

---

### 📱 Page 3 : `pages/ClientSuiviDetail.jsx`

**Objectif** : Page détail d'un suivi arrivée (timeline complète)

#### Récupération données (L84-130)

**📍 CODE EXACT** :
```javascript
const { data, isLoading } = useQuery({
  queryKey: ["client-suivi-detail", type, ficheId],
  enabled: type === "ARRIVEE" && !!ficheId,
  queryFn: async () => {
    // 1) fiche arrivée
    const fiche = await base44.entities.FicheArrivee.get(ficheId);

    // 2) suivi inventaire
    const suivis = await base44.entities.SuiviInventaire.filter(
      { fiche_arrivee_id: ficheId },
      "-created_at",
      10
    );
    const suivi = suivis?.[0] || null;

    // 3) interventions rattachées
    const interventions = await base44.entities.Intervention.filter(
      { fiche_arrivee_id: ficheId },
      "-created_at",
      50
    );

    // 4) events visibles client
    const events = [];
    for (const interventionId of interventionIds.slice(0, 10)) {
      const eventsForIntervention = await base44.entities.InterventionEvent.filter(
        { intervention_id: interventionId, visible_client: true },
        "-at",
        50
      );
      events.push(...eventsForIntervention);
    }
    
    return { fiche, suivi, interventions, events };
  }
});
```

**🔴 PROBLÈMES DÉTECTÉS** :

#### Problème D : Utilise entité `Intervention` au lieu de `InterventionClient`

**Code** (L102-106) :
```javascript
const interventions = await base44.entities.Intervention.filter(
  { fiche_arrivee_id: ficheId },
  "-created_at",
  50
);
```

**Schéma entité `Intervention`** (d'après snapshot) :
```javascript
{
  "name": "Intervention",
  "properties": {
    "sejour_id": { "type": "string" },
    "contexte": { "enum": ["ARRIVEE", "SEJOUR", "DEPART"] },
    "menage_statut": { ... },
    "technique_statut": { ... }
  }
}
```

**❓ QUESTION** : L'entité `Intervention` a-t-elle un champ `fiche_arrivee_id` ?
- ✅ Oui (visible dans le schéma)
- ⚠️ MAIS : Est-elle créée lors de l'arrivée ?

**Vérification dans ClientControleInventaire.jsx** :
- ❌ Aucune création d'entité `Intervention`
- ✅ Seulement `InterventionClient` + `WorkItem`

**🔴 CONCLUSION** : Les interventions arrivée ne sont PAS dans `Intervention`, donc cette query retourne vide.

#### Problème E : Dépendance à `SuiviInventaire`

**Code** (L94-99) :
```javascript
const suivis = await base44.entities.SuiviInventaire.filter(
  { fiche_arrivee_id: ficheId },
  "-created_at",
  10
);
const suivi = suivis?.[0] || null;
```

**Impact** :
- Si `SuiviInventaire` non créé (cf. Problème C) → `suivi = null`
- Timeline ne s'affiche pas
- Statuts services invisibles

---

### 📱 Page 4 : `pages/ClientSuiviSearch.jsx`

**Objectif** : Recherche de fiches arrivée par nom/prénom

#### Récupération données (L31-50)

**📍 CODE EXACT** :
```javascript
const { data: fiches = [], isLoading } = useQuery({
  queryKey: ["client-suivi-fiches", nomN, prenomN, searchTriggered],
  enabled: searchTriggered && !!nomN && !!prenomN,
  queryFn: async () => {
    const all = await base44.entities.FicheArrivee.list("-created_at", 300);

    const matches = all.filter((f) => {
      const fNom = normalize(f.client_nom);
      const fPrenom = normalize(f.client_prenom);
      return fNom === nomN && fPrenom === prenomN;
    });

    const byId = new Map();
    matches.forEach((f) => byId.set(f.id, f));
    return Array.from(byId.values());
  },
});
```

**✅ POINTS POSITIFS** :
- ✅ Lit `FicheArrivee` (entité correcte)
- ✅ Filtre par nom/prénom avec normalisation
- ✅ Déduplication par ID
- ✅ Limite 300 fiches (acceptable)

**Navigation** (L52-54) :
```javascript
const openArrivee = (ficheId) => {
  navigate(`${createPageUrl("ClientSuiviDetail")}?type=ARRIVEE&fiche_id=${encodeURIComponent(ficheId)}`);
};
```

**✅ OK** : Redirige vers `ClientSuiviDetail` avec le bon ficheId.

---

## 🚨 TABLEAU SYNTHÈSE : PROBLÈMES IDENTIFIÉS

| # | Problème | Fichier | Impact | Priorité |
|---|----------|---------|--------|----------|
| **A** | SuiviIntervention lit UNIQUEMENT Incident | SuiviIntervention.jsx L124 | Interventions arrivée invisibles | 🔴 CRITIQUE |
| **B** | SuiviIntervention filtre par stay_id absent | SuiviIntervention.jsx L128 | Même avec stay_id, interventions arrivée invisibles | 🔴 CRITIQUE |
| **C** | SuiviInventaire jamais créé lors arrivée | ClientControleInventaire.jsx | ClientSuiviInventaire vide | 🔴 CRITIQUE |
| **D** | ClientSuiviDetail lit Intervention au lieu de InterventionClient | ClientSuiviDetail.jsx L102 | Timeline vide pour arrivées | 🔴 CRITIQUE |
| **E** | InterventionEvent jamais créés pour InterventionClient | ClientControleInventaire.jsx | Pas de timeline visible client | 🔴 CRITIQUE |

---

## 📋 TABLEAU VALIDATION : INTERVENTIONS VISIBLES CLIENT

### Scénario 1 : Arrivée avec 2 services (MENAGE + TECHNIQUE)

**Setup** :
- Client : Jean Dupont
- Hébergement : MH Premium 2ch M03
- Arrivée : 13/01/2026
- Départ : 20/01/2026
- Anomalies :
  - 2 assiettes plates manquantes → MENAGE
  - 1 lit cassé (urgent) → TECHNIQUE

**Entités créées** (ClientControleInventaire.jsx) :
```javascript
FicheArrivee { id: 'fiche_abc', client_nom: 'Dupont', ... }

InterventionClient_MENAGE {
  id: 'ic_menage_123',
  service: 'MENAGE',
  taches: [{ texte: 'Assiettes plates - 2 manquant(s)', ... }],
  fiche_arrivee_id: 'fiche_abc',
  // ❌ PAS de stay_id
}

WorkItem_MENAGE {
  id: 'wi_menage_456',
  service: 'MENAGE',
  intervention_client_id: 'ic_menage_123',
  fiche_arrivee_id: 'fiche_abc',
  // ❌ PAS de stay_id
}

InterventionClient_TECHNIQUE {
  id: 'ic_tech_789',
  service: 'TECHNIQUE',
  taches: [{ texte: 'Lit double - Défectueux 🔴', ... }],
  fiche_arrivee_id: 'fiche_abc',
  // ❌ PAS de stay_id
}

WorkItem_TECHNIQUE {
  id: 'wi_tech_012',
  service: 'TECHNIQUE',
  intervention_client_id: 'ic_tech_789',
  fiche_arrivee_id: 'fiche_abc',
  // ❌ PAS de stay_id
}

// ❌ SuiviInventaire : NON CRÉÉ
// ❌ InterventionEvent : NON CRÉÉS
```

#### Test A : Client va dans "Suivi intervention" (SuiviIntervention.jsx)

**État session** :
```javascript
userData = {
  nom: 'Dupont',
  prenom: 'Jean',
  stayId: 'ARR-M03-20260113-AB12CD'  // ← Généré lors arrivée
}
```

**Query exécutée** (L127-133) :
```javascript
// Tentative 1 : par stay_id
const byStay = await base44.entities.Incident.filter(
  { stay_id: 'ARR-M03-20260113-AB12CD' }
);
// Résultat : [] (aucun Incident avec ce stay_id)

// InterventionClient créées N'ONT PAS ce champ stay_id
// → Aucune correspondance
```

**Affichage** :
```
┌──────────────────────────────────────┐
│  🔍 Aucun signalement trouvé         │
│                                      │
│  Aucun signalement n'est enregistré │
│  pour votre hébergement.             │
└──────────────────────────────────────┘
```

**🔴 RÉSULTAT** : ❌ Client ne voit PAS ses 2 interventions arrivée

---

#### Test B : Client va dans "Suivi inventaire" (ClientSuiviInventaire.jsx)

**Recherche** : "Dupont Jean"

**Query exécutée** (L80-105) :
```javascript
const allSuivis = await base44.entities.SuiviInventaire.list('-created_date', 200);
// Résultat : []  (aucun SuiviInventaire créé lors arrivée)

const filtered = allSuivis.filter(...);
// Résultat : []
```

**Affichage** :
```
┌──────────────────────────────────────┐
│  📦 Aucun suivi d'inventaire trouvé  │
│                                      │
│  Les suivis apparaîtront ici si      │
│  des objets sont signalés lors       │
│  de vos inventaires                  │
└──────────────────────────────────────┘
```

**🔴 RÉSULTAT** : ❌ Client ne voit PAS ses interventions arrivée

---

#### Test C : Client accède au lien direct ClientSuiviDetail

**URL** : `ClientSuiviDetail?type=ARRIVEE&fiche_id=fiche_abc`

**Query exécutée** (L89-129) :
```javascript
// 1) Fiche arrivée
const fiche = await base44.entities.FicheArrivee.get('fiche_abc');
// ✅ Récupérée OK

// 2) SuiviInventaire
const suivis = await base44.entities.SuiviInventaire.filter(
  { fiche_arrivee_id: 'fiche_abc' }
);
const suivi = suivis?.[0] || null;
// ❌ Résultat : null (pas créé)

// 3) Interventions
const interventions = await base44.entities.Intervention.filter(
  { fiche_arrivee_id: 'fiche_abc' }
);
// ❌ Résultat : [] (mauvaise entité, devrait lire InterventionClient)

// 4) Events
const events = [];  // ← Vide car interventions = []
```

**Affichage** :
```
┌──────────────────────────────────────┐
│  Jean Dupont                         │
│  Logement MH Premium 2ch M03         │
│  13/01/2026 → 20/01/2026             │
├──────────────────────────────────────┤
│  📅 Historique de votre demande      │
│                                      │
│  Aucune mise à jour pour le moment.  │ ← ❌ Timeline vide
└──────────────────────────────────────┘
```

**🔴 RÉSULTAT** : ❌ Client ne voit PAS la timeline de ses interventions

---

### Scénario 2 : Signalement pendant séjour (robinet fuit)

**Setup** :
- Client signale problème technique (robinet fuit) depuis l'espace client
- `Incident` créé avec stay_id

**Entités créées** :
```javascript
Incident {
  id: 'inc_xyz',
  type: 'technique',
  categorie: 'plomberie',
  description: 'Robinet fuit',
  stay_id: 'ARR-M03-20260113-AB12CD',  // ✅ stay_id présent
  client_nom: 'Dupont',
  client_prenom: 'Jean',
  logement: 'M03',
  statut: 'en_attente'
}

// ❓ SuiviInventaire créé ?
// Vérification dans components/syncSuiviInventaire.jsx :
// → Fonction createSuiviFromIncident existe
// → MAIS jamais appelée dans le workflow signalement
```

#### Test D : Client va dans "Suivi intervention" (SuiviIntervention.jsx)

**Query exécutée** (L127-133) :
```javascript
const byStay = await base44.entities.Incident.filter(
  { stay_id: 'ARR-M03-20260113-AB12CD' }
);
// ✅ Résultat : [Incident { id: 'inc_xyz', ... }]
```

**Affichage** :
```
┌──────────────────────────────────────┐
│  ⚡ EN COURS (1)                      │
├──────────────────────────────────────┤
│  📍 M03                              │
│  🔧 Robinet fuit                     │
│  ⏳ En attente                       │
│                                      │
│  [Discuter avec le technicien]       │  ← Si pris_par existe
└──────────────────────────────────────┘
```

**✅ RÉSULTAT** : Client VOIT son signalement

#### Test E : Service TECHNIQUE prend en charge

**Action** : Agent "Pierre" prend en charge l'incident

**Entités mises à jour** :
```javascript
Incident {
  id: 'inc_xyz',
  statut: 'en_cours',  // ← Mise à jour
  pris_par: 'Pierre',
  date_debut: '2026-01-13T10:30:00Z'
}

InterventionEvent {  // ← Créé dans Technique.jsx (via pushClientEvent)
  intervention_id: 'inc_xyz',
  type: 'PRISE_EN_CHARGE',
  message_client: "L'équipe technique est en cours d'intervention.",
  visible_client: true,
  at: '2026-01-13T10:30:00Z'
}

// ❓ SuiviInventaire synchronisé ?
// → Non, fonction syncIncidentToSuivi pas appelée
```

**Affichage client** (SuiviIntervention.jsx L224-251) :
```
┌──────────────────────────────────────┐
│  ⚡ EN COURS (1)                      │
├──────────────────────────────────────┤
│  🔧 En cours                         │
│                                      │
│  📍 M03                              │
│  🔧 Robinet fuit                     │
│  👤 Pierre                           │ ← pris_par affiché
│                                      │
│  [Discuter - Pierre]                 │ ← Chat disponible
│                                      │
│  📅 Timeline :                       │
│  10:30 - Demande enregistrée         │
│  10:30 - L'équipe technique est...   │ ← InterventionEvent
└──────────────────────────────────────┘
```

**✅ RÉSULTAT** : Client voit l'évolution du signalement

---

## 📊 TABLEAU COMPARATIF : VISIBILITÉ INTERVENTIONS

| Origine | Entité créée | stay_id ? | SuiviInventaire créé ? | Visible dans SuiviIntervention.jsx ? | Visible dans ClientSuiviInventaire.jsx ? | Visible dans ClientSuiviDetail.jsx ? |
|---------|--------------|-----------|------------------------|--------------------------------------|------------------------------------------|--------------------------------------|
| **ARRIVÉE** (inventaire) | InterventionClient + WorkItem | ❌ Non | ❌ Non | ❌ Non | ❌ Non | ❌ Non (Intervention vide) |
| **SÉJOUR** (signalement) | Incident | ✅ Oui | ❌ Non (fonction existe mais pas appelée) | ✅ Oui (si stay_id) | ❌ Non (SuiviInventaire vide) | N/A (pas de fiche) |

---

## 🔴 PROBLÈMES CRITIQUES SYNTHÈSE

### 1. Interventions ARRIVÉE totalement invisibles client

**Cause** :
- ❌ `InterventionClient` / `WorkItem` n'ont pas de `stay_id`
- ❌ `SuiviInventaire` jamais créé lors validation inventaire
- ❌ `InterventionEvent` jamais créés pour InterventionClient

**Impact** :
```
Client valide inventaire avec 5 anomalies (3 TECHNIQUE + 2 MENAGE)
→ 2 InterventionClient créées
→ 2 WorkItems créés
→ Services TECHNIQUE/MENAGE voient les tâches ✅
→ CLIENT NE VOIT RIEN ❌
```

**Statut** : 🔴 **BLOQUANT - Fonctionnalité suivi arrivée NON FONCTIONNELLE**

---

### 2. Signalements SÉJOUR partiellement visibles

**Cause** :
- ✅ `Incident` a un `stay_id` → visible dans SuiviIntervention.jsx
- ❌ Mais `SuiviInventaire` jamais créé → invisible dans ClientSuiviInventaire.jsx
- ✅ `InterventionEvent` créés par les services → timeline visible

**Impact** :
```
Client signale robinet fuit
→ Incident créé avec stay_id ✅
→ SuiviIntervention.jsx : ✅ Visible
→ ClientSuiviInventaire.jsx : ❌ Invisible (pas de SuiviInventaire)
→ Timeline : ✅ Visible (InterventionEvent OK)
```

**Statut** : 🟡 **PARTIEL - Fonctionne dans 1 interface sur 2**

---

## 🎯 CORRECTIONS REQUISES (PAR PRIORITÉ)

### 🔴 PHASE 1 : Rendre interventions ARRIVÉE visibles (CRITIQUE)

#### Correction 1.1 : Créer SuiviInventaire lors validation arrivée

**Fichier** : `pages/ClientControleInventaire.jsx`  
**Ligne** : Ajouter après L715 (création FicheArrivee)

**Code à ajouter** :
```javascript
// Créer SuiviInventaire pour visibilité client
await base44.entities.SuiviInventaire.create({
  client_nom: nom,
  client_prenom: prenom,
  client_email: '', // À récupérer si disponible
  logement: numero,
  categorie_logement: categorie,
  type_inventaire: 'ARRIVEE',
  date_arrivee: dateArrivee,
  date_depart: dateDepart,
  items_menage: menage.map(m => ({
    key: m.id,
    label: m.label,
    quantity: m.qtyManquante || 1,
    motif: m.problemeTechnique ? 'Défectueux' : 'Manquant'
  })),
  items_technique: technique.map(t => ({
    key: t.id,
    label: t.label,
    quantity: t.qtyManquante || 1,
    motif: t.problemeTechnique ? 'Défectueux' : 'Manquant'
  })),
  statut_menage: menage.length > 0 ? 'en_attente' : 'non_requis',
  statut_technique: technique.length > 0 ? 'en_attente' : 'non_requis',
  timeline_menage: menage.length > 0 ? [{
    timestamp: Date.now(),
    status: 'demande_recue',
    detail: 'Demande transmise au service ménage',
    utilisateur: ''
  }] : [],
  timeline_technique: technique.length > 0 ? [{
    timestamp: Date.now(),
    status: 'demande_recue',
    detail: 'Demande transmise au service technique',
    utilisateur: ''
  }] : [],
  fiche_arrivee_id: fiche.id
});
```

**Priorité** : 🔴 CRITIQUE

---

#### Correction 1.2 : Ajouter stay_id aux InterventionClient/WorkItem

**Fichier** : `pages/ClientControleInventaire.jsx`  
**Fonction** : `createIntervention()` (L170-292)

**Ligne 205-221** :
```javascript
const interventionClient = await base44.entities.InterventionClient.create({
  type_intervention: "INVENTAIRE_ARRIVEE",
  // ... champs existants
  fiche_arrivee_id: ficheId,
  stay_id: sessionStorage.getItem('stay_id')  // ← AJOUTER
});
```

**Ligne 234-253** :
```javascript
await base44.entities.WorkItem.create({
  type: 'INTERVENTION_CLIENT',
  // ... champs existants
  fiche_arrivee_id: ficheId,
  stay_id: sessionStorage.getItem('stay_id')  // ← AJOUTER
});
```

**⚠️ ATTENTION** : Vérifier schéma entités `InterventionClient` et `WorkItem` pour confirmer que le champ `stay_id` existe.

**Priorité** : 🟡 MOYENNE (si schéma le permet)

---

#### Correction 1.3 : Synchroniser WorkItem → SuiviInventaire

**Fichier** : `pages/Technique.jsx` et `pages/Menage.jsx`  
**Lignes** : Après chaque mutation (prise en charge, clôture, attente)

**Ajouter après ligne 190 (Menage.jsx) - Prise en charge** :
```javascript
// Synchroniser vers SuiviInventaire
if (incident.fiche_arrivee_id) {
  const suivis = await base44.entities.SuiviInventaire.filter({
    fiche_arrivee_id: incident.fiche_arrivee_id
  });
  
  if (suivis.length > 0) {
    const suivi = suivis[0];
    const currentTimeline = suivi.timeline_menage || [];
    
    await base44.entities.SuiviInventaire.update(suivi.id, {
      statut_menage: 'en_cours',
      timeline_menage: [
        ...currentTimeline,
        {
          timestamp: Date.now(),
          status: 'prise_en_charge',
          detail: `Prise en charge par ${collaborateurNom}`,
          utilisateur: collaborateurNom
        }
      ],
      date_derniere_maj: new Date().toISOString()
    });
  }
}
```

**Priorité** : 🔴 CRITIQUE

---

### 🟡 PHASE 2 : Améliorer cohérence signalements SÉJOUR

#### Correction 2.1 : Créer SuiviInventaire lors signalement

**Fichier** : Page de signalement client (à identifier)  
**Action** : Appeler `createSuiviFromIncident()` après création `Incident`

**Priorité** : 🟡 MOYENNE

---

## 📋 TABLEAU VALIDATION POST-CORRECTIONS (THÉORIQUE)

| Intervention | Origine | Visible SuiviIntervention ? | Visible ClientSuiviInventaire ? | Timeline dynamique ? | Écart vs attendu |
|--------------|---------|-----------------------------|---------------------------------|----------------------|------------------|
| Assiettes manquantes | ARRIVÉE | 🔴 ❌ Non (pas de stay_id) | 🔴 ❌ Non (pas de SuiviInventaire) | 🔴 ❌ Non | **CORRECTION 1.1 + 1.2 + 1.3 requis** |
| Lit cassé urgent | ARRIVÉE | 🔴 ❌ Non | 🔴 ❌ Non | 🔴 ❌ Non | **CORRECTION 1.1 + 1.2 + 1.3 requis** |
| Robinet fuit | SÉJOUR (signalement) | ✅ Oui (stay_id OK) | 🟡 ⚠️ Non (si SuiviInventaire pas créé) | ✅ Oui (InterventionEvent OK) | Correction 2.1 recommandée |

---

## ✅ CRITÈRES ACCEPTATION

### Critère 1 : Client voit TOUTES ses interventions

**Test** :
- [ ] Arrivée avec 3 anomalies (2 MENAGE, 1 TECHNIQUE)
- [ ] + 1 signalement pendant séjour
- [ ] Client accède à "Suivi intervention"
- [ ] ATTENDU : 4 interventions affichées
- [ ] ACTUEL : 🔴 1 seule (signalement séjour)

**Statut** : ❌ NON VALIDÉ

---

### Critère 2 : Uniquement les interventions du client

**Test** :
- [ ] 2 clients dans camping (Jean Dupont M03, Marie Martin M04)
- [ ] Jean a 2 interventions, Marie a 3 interventions
- [ ] Jean accède à "Suivi intervention"
- [ ] ATTENDU : 2 interventions (uniquement les siennes)
- [ ] ACTUEL : ⚠️ Dépend du filtre (si stay_id correct, OK)

**Statut** : 🟡 PARTIEL (fonctionne pour signalements séjour, pas pour arrivées)

---

### Critère 3 : Statut compréhensible

**Mapping actuel** (SuiviIntervention.jsx L164-177) :
```javascript
const getStatusConfig = statut => {
  switch (statut) {
    case 'en_attente':
      return { label: 'Demande envoyée' };  // ✅ OK
    case 'en_cours':
      return { label: 'En cours' };  // ✅ OK
    case 'en_attente_materiel':
      return { label: 'En attente' };  // ✅ OK
    case 'resolu':
      return { label: 'Résolu' };  // ✅ OK
  }
};
```

**Statut** : ✅ OK (si données arrivent)

---

### Critère 4 : Pas de fuite d'informations internes

**Vérification dans SuiviIntervention.jsx** :
- ✅ Affiche uniquement `InterventionEvent` avec `visible_client: true`
- ✅ N'affiche pas `commentaire_interne`
- ✅ N'affiche pas détails WorkItem

**Statut** : ✅ OK (si données arrivent)

---

### Critère 5 : Pas de doublons

**Problème potentiel** :
- Si `SuiviInventaire` créé + `Incident` créé + `InterventionClient` créée
- Risque d'afficher 2x la même intervention

**Vérification** :
- `SuiviIntervention.jsx` lit UNIQUEMENT `Incident` (L124)
- `ClientSuiviInventaire.jsx` lit UNIQUEMENT `SuiviInventaire` (L80)
- Pas de fusion → ✅ Pas de doublon ACTUEL

**Statut** : ✅ OK (mais données manquantes)

---

## 🎯 CONCLUSION ANALYSE SUIVI CLIENT

### ✅ Points forts identifiés
1. ✅ Architecture `SuiviInventaire` bien conçue (timeline, statuts par service)
2. ✅ Signalements SÉJOUR fonctionnels (si stay_id présent)
3. ✅ Timeline `InterventionEvent` fonctionnelle pour `Incident`
4. ✅ Pas de fuite d'informations internes
5. ✅ Chat client/technicien fonctionnel

### 🔴 Points critiques bloquants
1. 🔴 **Interventions ARRIVÉE invisibles client** (SuiviInventaire jamais créé)
2. 🔴 **InterventionClient/WorkItem n'ont pas de stay_id** (impossibles à filtrer)
3. 🔴 **Aucune synchronisation WorkItem → SuiviInventaire** (timeline jamais alimentée)
4. 🔴 **ClientSuiviDetail lit mauvaise entité** (Intervention au lieu de InterventionClient)
5. 🔴 **BureauHistorique ne lit pas WorkItems** (cf. analyse précédente)

### 📊 Taux de couverture actuel

**Interventions visibles client** :
- Arrivée (via inventaire) : 🔴 0% (0/N)
- Séjour (via signalement) : 🟡 50% (visible dans 1 interface sur 2)

**Taux global** : 🔴 **25% environ** (1 interface sur 4 fonctionnelle, et seulement pour signalements)

---

## 🚀 PLAN DE CORRECTION RECOMMANDÉ

### Étape 1 : Créer SuiviInventaire lors arrivée (CRITIQUE)
- Fichier : `ClientControleInventaire.jsx`
- Ligne : Après L715
- Complexité : Moyenne
- Impact : Débloque visibilité arrivée dans ClientSuiviInventaire

### Étape 2 : Synchroniser WorkItem → SuiviInventaire (CRITIQUE)
- Fichiers : `Technique.jsx`, `Menage.jsx`
- Lignes : Après chaque mutation (prise en charge, clôture, attente)
- Complexité : Élevée (7 points de sync)
- Impact : Timeline temps réel fonctionnelle

### Étape 3 : Ajouter stay_id aux InterventionClient/WorkItem (RECOMMANDÉ)
- Fichier : `ClientControleInventaire.jsx`
- Lignes : L205-221, L234-253
- Complexité : Faible
- Prérequis : Vérifier schéma entités
- Impact : Permet filtre par stay_id dans SuiviIntervention

### Étape 4 : Corriger ClientSuiviDetail (MOYENNE)
- Fichier : `ClientSuiviDetail.jsx`
- Ligne : L102-106
- Action : Lire `InterventionClient` + `WorkItem` au lieu de `Intervention`
- Complexité : Moyenne
- Impact : Timeline détaillée fonctionnelle

---

## 📝 STATUT VALIDATION

**Statut global suivi client** : 🔴 **NON VALIDÉ LOGIQUEMENT**

**Critères acceptation** :
- ❌ Client ne voit PAS toutes ses interventions (0% arrivée)
- 🟡 Filtre par client fonctionne (si données arrivent)
- ✅ Statut compréhensible
- ✅ Pas de fuite infos internes
- ✅ Pas de doublons

**Prochaine action** : Appliquer corrections PHASE 1 (CRITIQUE).