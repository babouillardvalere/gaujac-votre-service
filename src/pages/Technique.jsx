// TECHNIQUE – VERSION COMPLÈTE CORRIGÉE AVEC TIMELINE CLIENT


return (
<div className="min-h-screen">
<OfflineBanner />


<div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
<div className="max-w-4xl mx-auto flex justify-between">
<h1 className="text-xl font-heading">{t('menu_technique')}</h1>
<div className="flex gap-2">
<Button variant="ghost" onClick={() => navigate(createPageUrl('MenuCollaborateur'))}><Home /></Button>
<CollaborateurNotificationBell />
</div>
</div>
</div>


<div className="max-w-4xl mx-auto px-4 py-6">
<Tabs value={activeTab} onValueChange={setActiveTab}>
<TabsList className="grid grid-cols-3">
<TabsTrigger value="interventions">Interventions</TabsTrigger>
<TabsTrigger value="missions">Missions</TabsTrigger>
</TabsList>


<TabsContent value="interventions">
<ModeleInterventionSelector />


{isLoading ? (
<Loader2 className="animate-spin" />
) : (
filteredIncidents.map(incident => (
<motion.div key={incident.id}>
<Card onClick={() => setSelectedIncident(incident)} className="mb-4 cursor-pointer">
<CardContent>
<div className="flex justify-between">
<span>{incident.logement}</span>
<Badge>{incident.statut}</Badge>
</div>
<p>{incident.description}</p>
</CardContent>
</Card>
</motion.div>
))
)}
</TabsContent>


<TabsContent value="missions">
<ServiceMissionDashboard service="TECHNIQUE" serviceLabel={t('menu_technique')} />
</TabsContent>
</Tabs>
</div>


{/* DIALOG */}
<Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
<DialogContent className="max-w-2xl">
<DialogHeader>
<DialogTitle>Intervention</DialogTitle>
</DialogHeader>


{selectedIncident && (
<div className="space-y-4">
<Input placeholder={t('votre_nom')} value={collaborateurNom} onChange={e => setCollaborateurNom(e.target.value)} />
<Textarea placeholder={t('commentaire_optionnel')} value={commentaire} onChange={e => setCommentaire(e.target.value)} />


{selectedIncident.statut === 'en_attente' && (
<Button onClick={() => handlePrendreEnCharge(selectedIncident)}>{t('prendre_en_charge')}</Button>
)}


{selectedIncident.statut === 'en_cours' && (
<Button onClick={() => handleTerminerSansPhoto(selectedIncident)}>{t('terminer')}</Button>
)}


<InterventionDocuments incidentId={selectedIncident.id} documents={documents} canAdd />
<InterventionHistorique logs={logs} />
</div>
)}
</DialogContent>
</Dialog>


<MettreEnAttenteDialog
open={showAttenteDialog}
onOpenChange={setShowAttenteDialog}
onConfirm={confirmMettreEnAttente}
/>


<PhotoInterventionCapture
open={showPhotoAvant}
onOpenChange={setShowPhotoAvant}
type="avant"
interventionId={incidentForPhoto?.id || ''}
collaborateurNom={collaborateurNom}
onPhotoUploaded={() => setShowPhotoAvant(false)}
/>


<PhotoInterventionCapture
open={showPhotoApres}
onOpenChange={setShowPhotoApres}
type="apres"
interventionId={incidentForPhoto?.id || ''}
collaborateurNom={collaborateurNom}
onPhotoUploaded={() => setShowPhotoApres(false)}
/>
</div>
);
}