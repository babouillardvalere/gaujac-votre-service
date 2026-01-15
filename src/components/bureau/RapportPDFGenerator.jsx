import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, TrendingUp, Clock, Users, Home, Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

export default function RapportPDFGenerator({ rapport, lang = 'fr' }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // En-tête selon type
    doc.setFontSize(20);
    doc.setTextColor(102, 58, 237);
    const titreRapport = rapport.type === 'LITIGES' ? 'RAPPORT DES LITIGES CLIENTS' :
                         rapport.type === 'AVIS' ? 'RAPPORT DES AVIS CLIENTS' :
                         'RAPPORT OPÉRATIONNEL';
    doc.text(titreRapport, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const sousTitre = rapport.type === 'OPERATIONNEL' ? 
      `${rapport.metadata.periode_type} - ${rapport.metadata.portee}` :
      rapport.metadata.periode_type;
    doc.text(sousTitre, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.text(`Période: ${format(new Date(rapport.metadata.date_debut), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(rapport.metadata.date_fin), 'dd/MM/yyyy', { locale: fr })}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Généré le: ${format(new Date(rapport.metadata.genere_le), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // RAPPORT LITIGES
    if (rapport.type === 'LITIGES') {
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text('LITIGES CLIENTS', 14, y);
      y += 10;

      const litigesData = rapport.sections.litiges.map(l => [
        format(new Date(l.date_creation), 'dd/MM', { locale: fr }),
        `${l.client_prenom} ${l.client_nom}`,
        l.hebergement,
        l.service_concerne,
        l.motif.replace(/_/g, ' '),
        l.statut,
        l.date_cloture ? format(new Date(l.date_cloture), 'dd/MM', { locale: fr }) : '-'
      ]);

      if (litigesData.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['Date', 'Client', 'Hébergement', 'Service', 'Motif', 'Statut', 'Clôture']],
          body: litigesData,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] },
          styles: { fontSize: 8 }
        });
        y = doc.lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text('Aucun litige sur cette période.', 14, y);
        y += 15;
      }

      // Synthèse litiges
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text('SYNTHÈSE', 14, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total litiges: ${rapport.sections.synthese.total}`, 14, y);
      y += 6;
      doc.text(`Ouverts: ${rapport.sections.synthese.ouverts}`, 14, y);
      y += 6;
      doc.text(`Clos: ${rapport.sections.synthese.clos}`, 14, y);
      y += 10;

      Object.entries(rapport.sections.synthese.par_service).forEach(([service, count]) => {
        doc.text(`${service}: ${count} litige(s)`, 14, y);
        y += 6;
      });

      const filename = `rapport_litiges_${rapport.metadata.date_debut}_${rapport.metadata.date_fin}.pdf`;
      doc.save(filename);
      toast.success('📥 PDF téléchargé');
      return;
    }

    // RAPPORT AVIS
    if (rapport.type === 'AVIS') {
      doc.setFontSize(14);
      doc.setTextColor(234, 179, 8);
      doc.text('A. AVIS SUR LES INTERVENTIONS', 14, y);
      y += 10;

      const avisIntervData = rapport.sections.avis_interventions.map(a => [
        format(new Date(a.created_date), 'dd/MM', { locale: fr }),
        a.incident_id ? 'Incident' : 'Intervention',
        a.note_client?.toString() || '-',
        a.commentaire_client?.substring(0, 50) || '-'
      ]);

      if (avisIntervData.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['Date', 'Type', 'Note', 'Commentaire']],
          body: avisIntervData,
          theme: 'striped',
          headStyles: { fillColor: [234, 179, 8] },
          styles: { fontSize: 8 }
        });
        y = doc.lastAutoTable.finalY + 15;
      }

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(234, 179, 8);
      doc.text('B. AVIS SUR L\'APPLICATION', 14, y);
      y += 10;

      const avisAppData = rapport.sections.avis_application.map(a => [
        format(new Date(a.created_date), 'dd/MM', { locale: fr }),
        a.facilite_utilisation?.toString() || '-',
        a.suivi_interventions?.toString() || '-',
        a.commentaire?.substring(0, 50) || '-'
      ]);

      if (avisAppData.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['Date', 'Facilité', 'Suivi', 'Commentaire']],
          body: avisAppData,
          theme: 'striped',
          headStyles: { fillColor: [234, 179, 8] },
          styles: { fontSize: 8 }
        });
        y = doc.lastAutoTable.finalY + 15;
      }

      // Synthèse avis
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(234, 179, 8);
      doc.text('SYNTHÈSE SATISFACTION', 14, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Avis interventions: ${rapport.sections.synthese.interventions.count}`, 14, y);
      y += 6;
      doc.text(`Moyenne: ${rapport.sections.synthese.interventions.moyenne_globale}/5`, 14, y);
      y += 10;
      doc.text(`Avis application: ${rapport.sections.synthese.application.count}`, 14, y);
      y += 6;
      if (rapport.sections.synthese.application.moyennes.facilite) {
        doc.text(`Facilité: ${rapport.sections.synthese.application.moyennes.facilite}/5`, 14, y);
        y += 6;
        doc.text(`Suivi: ${rapport.sections.synthese.application.moyennes.suivi}/5`, 14, y);
      }

      const filename = `rapport_avis_${rapport.metadata.date_debut}_${rapport.metadata.date_fin}.pdf`;
      doc.save(filename);
      toast.success('📥 PDF téléchargé');
      return;
    }

    // RAPPORT OPERATIONNEL (par défaut)
    // Section A - Activité des interventions
    doc.setFontSize(14);
    doc.setTextColor(0, 119, 168);
    doc.text('A. ACTIVITÉ DES INTERVENTIONS', 14, y);
    y += 10;

    const interventionsData = [
      ...rapport.sections.interventions.workItems.map(w => [
        w.service || 'N/A',
        w.collaborateur || 'Non assigné',
        w.hebergement || 'N/A',
        w.titre || 'N/A',
        format(new Date(w.created_date), 'dd/MM', { locale: fr }),
        w.statut || 'N/A',
        w.duree_minutes ? `${w.duree_minutes} min` : '-'
      ]),
      ...rapport.sections.interventions.incidents.map(i => [
        i.type || 'N/A',
        i.pris_par || 'Non assigné',
        i.logement || i.emplacement || 'N/A',
        i.description?.substring(0, 30) || 'N/A',
        format(new Date(i.date_saisie), 'dd/MM', { locale: fr }),
        i.statut || 'N/A',
        i.temps_total_intervention ? `${i.temps_total_intervention} min` : '-'
      ])
    ];

    if (interventionsData.length > 0) {
      doc.autoTable({
        startY: y,
        head: [['Service', 'Collaborateur', 'Hébergement', 'Objet', 'Date', 'Statut', 'Temps']],
        body: interventionsData,
        theme: 'striped',
        headStyles: { fillColor: [0, 119, 168] },
        styles: { fontSize: 8 }
      });
      y = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.text('Aucune intervention sur cette période.', 14, y);
      y += 15;
    }

    // Section B - Temps de travail
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 119, 168);
    doc.text('B. TEMPS DE TRAVAIL & CHARGE', 14, y);
    y += 10;

    const tempsData = rapport.sections.temps.map(t => [
      t.collaborateur,
      t.total_interventions.toString(),
      `${Math.floor(t.total_temps / 60)}h ${t.total_temps % 60}min`,
      `${t.moyenne} min`
    ]);

    if (tempsData.length > 0) {
      doc.autoTable({
        startY: y,
        head: [['Collaborateur', 'Interventions', 'Temps total', 'Moyenne/intervention']],
        body: tempsData,
        theme: 'striped',
        headStyles: { fillColor: [0, 119, 168] },
        styles: { fontSize: 9 }
      });
      y = doc.lastAutoTable.finalY + 15;
    }

    // Section C - Interventions par hébergement
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 119, 168);
    doc.text('C. INTERVENTIONS PAR HÉBERGEMENT', 14, y);
    y += 10;

    const hebData = rapport.sections.hebergements.map(h => [
      h.numero,
      h.categorie || 'N/A',
      h.services
    ]);

    if (hebData.length > 0) {
      doc.autoTable({
        startY: y,
        head: [['Numéro', 'Catégorie', 'Services intervenus']],
        body: hebData,
        theme: 'striped',
        headStyles: { fillColor: [0, 119, 168] },
        styles: { fontSize: 9 }
      });
      y = doc.lastAutoTable.finalY + 15;
    }

    // Section D - Synthèse Direction
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(102, 58, 237);
    doc.text('D. SYNTHÈSE DIRECTION', 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total interventions: ${rapport.sections.synthese.total_interventions}`, 14, y);
    y += 8;
    doc.text(`Temps total: ${Math.floor(rapport.sections.synthese.total_temps_minutes / 60)}h ${rapport.sections.synthese.total_temps_minutes % 60}min`, 14, y);
    y += 8;
    doc.text(`Service le plus sollicité: ${rapport.sections.synthese.service_plus_sollicite}`, 14, y);

    // Télécharger
    const filename = `rapport_${rapport.metadata.periode_type}_${rapport.metadata.date_debut}_${rapport.metadata.date_fin}.pdf`;
    doc.save(filename);
    toast.success('📥 PDF téléchargé');
  };

  const { sections, metadata, type } = rapport;
  
  // Stats selon type de rapport
  const totalInterventions = type === 'OPERATIONNEL' ? 
    (sections.interventions?.workItems.length || 0) + (sections.interventions?.incidents.length || 0) :
    type === 'LITIGES' ? sections.litiges?.length || 0 :
    type === 'AVIS' ? (sections.avis_interventions?.length || 0) + (sections.avis_application?.length || 0) :
    0;

  return (
    <Card className="border-2 border-green-300">
      <CardHeader>
        <CardTitle className="font-heading text-green-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Aperçu du rapport
          </div>
          <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Télécharger PDF
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métadonnées */}
        <div className={`rounded-lg p-4 border ${
          type === 'LITIGES' ? 'bg-red-50 border-red-200' :
          type === 'AVIS' ? 'bg-yellow-50 border-yellow-200' :
          'bg-purple-50 border-purple-200'
        }`}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-bold">Type rapport:</span>
              <Badge className={`ml-2 ${
                type === 'LITIGES' ? 'bg-red-600' :
                type === 'AVIS' ? 'bg-yellow-600' :
                'bg-purple-600'
              }`}>
                {type === 'LITIGES' ? '⚠️ Litiges' :
                 type === 'AVIS' ? '⭐ Avis' :
                 '🗂 Opérationnel'}
              </Badge>
            </div>
            <div>
              <span className="font-bold">Périodicité:</span>
              <Badge className="ml-2 bg-blue-600">{metadata.periode_type}</Badge>
            </div>
            {type === 'OPERATIONNEL' && metadata.portee && (
              <div>
                <span className="font-bold">Portée:</span>
                <Badge className="ml-2 bg-blue-600">{metadata.portee}</Badge>
              </div>
            )}
            <div className="col-span-2">
              <span className="font-bold">Période:</span>
              <span className="ml-2">
                {format(new Date(metadata.date_debut), 'dd/MM/yyyy', { locale: fr })} au{' '}
                {format(new Date(metadata.date_fin), 'dd/MM/yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        </div>

        {/* Statistiques clés selon type */}
        {type === 'OPERATIONNEL' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">Interventions</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{totalInterventions}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-xs font-bold text-green-900">Temps total</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {Math.floor(sections.synthese.total_temps_minutes / 60)}h
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-900">Collaborateurs</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{sections.temps.length}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">Hébergements</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{sections.hebergements.length}</p>
            </div>
          </div>
        )}

        {type === 'LITIGES' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-xs font-bold text-red-900">Total litiges</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{sections.synthese.total}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-bold text-orange-900">Ouverts</span>
              </div>
              <p className="text-2xl font-bold text-orange-700">{sections.synthese.ouverts}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-xs font-bold text-green-900">Clos</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{sections.synthese.clos}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-bold text-gray-900">Services</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">
                {Object.keys(sections.synthese.par_service).length}
              </p>
            </div>
          </div>
        )}

        {type === 'AVIS' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-900">Avis interventions</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{sections.synthese.interventions.count}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">Moyenne interv.</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{sections.synthese.interventions.moyenne_globale}/5</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">Avis app</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{sections.synthese.application.count}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-xs font-bold text-green-900">Facilité app</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {sections.synthese.application.moyennes.facilite || 'N/A'}/5
              </p>
            </div>
          </div>
        )}

        {/* Détail sections selon type */}
        {type === 'OPERATIONNEL' && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">📊 Section A - Activité</h4>
              <p className="text-xs text-gray-600">
                {sections.interventions.workItems.length} WorkItems + {sections.interventions.incidents.length} Incidents
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">⏱️ Section B - Temps & Charge</h4>
              <p className="text-xs text-gray-600">
                {sections.temps.length} collaborateur(s) suivis
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">🏠 Section C - Hébergements</h4>
              <p className="text-xs text-gray-600">
                {sections.hebergements.length} hébergement(s) avec interventions
              </p>
            </div>
          </div>
        )}

        {type === 'LITIGES' && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">⚠️ Litiges déclarés</h4>
              <p className="text-xs text-gray-600">
                {sections.litiges.length} litige(s) total
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">📊 Répartition par service</h4>
              <div className="space-y-1">
                {Object.entries(sections.synthese.par_service).map(([service, count]) => (
                  <p key={service} className="text-xs text-gray-600">
                    {service}: {count} litige(s)
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {type === 'AVIS' && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">⭐ Avis sur interventions</h4>
              <p className="text-xs text-gray-600">
                {sections.synthese.interventions.count} avis • Moyenne: {sections.synthese.interventions.moyenne_globale}/5
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-bold text-sm mb-2">📱 Avis sur l'application</h4>
              <p className="text-xs text-gray-600">
                {sections.synthese.application.count} avis • Facilité: {sections.synthese.application.moyennes.facilite || 'N/A'}/5
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}