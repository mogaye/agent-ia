import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, RefreshCw, Scale, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'legal_notices' | 'security';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'legal_notices'
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  // Sync state if initialDoc changes when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveDoc(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  const docs = [
    { id: 'legal_notices' as const, label: 'Mentions Légales', icon: Scale },
    { id: 'terms' as const, label: 'CGU & CGV', icon: FileText },
    { id: 'privacy' as const, label: 'Confidentialité & Données (CDP/RGPD)', icon: Lock },
    { id: 'security' as const, label: 'Sécurité & Paiements', icon: ShieldCheck }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-[#ECF0F3] rounded-3xl neu-flat flex flex-col overflow-hidden border border-white/80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#D1D9E6] flex items-center justify-between bg-gradient-to-r from-slate-100 to-[#ECF0F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-pressed flex items-center justify-center text-sky-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                Centre de Conformité & Réglementations Officielles
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Conforme aux réglementations de paiement et à la protection des données
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl neu-flat flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto p-2 gap-2 border-b border-[#D1D9E6] bg-[#E2E8F0]/40 no-scrollbar">
          {docs.map((doc) => {
            const Icon = doc.icon;
            const isActive = activeDoc === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'neu-pressed text-sky-800 bg-[#E0E5EC]'
                    : 'neu-flat text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{doc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed font-sans max-h-[60vh]">
          {/* MENTIONS LÉGALES */}
          {activeDoc === 'legal_notices' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl neu-pressed border-l-4 border-sky-600">
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">1. Éditeur de la Plateforme</h3>
                <p>
                  Le service en ligne <strong>SMG Flow</strong> (accessible sur https://smgflow.pro) est édité et exploité par la société <strong>SMG Flow SAS</strong>, solution technologique d'automatisation et d'intelligence artificielle pour entreprises.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-sky-600" /> Email légal : contact@smgflow.pro</div>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">2. Direction de la Publication</h4>
                <p>
                  Directeur de la publication et responsable de la rédaction : <strong>Direction Générale SMG Flow</strong> (contactable directement à contact@smgflow.pro).
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">3. Hébergement de l'Infrastructure</h4>
                <p>
                  Les infrastructures serveur, bases de données sécurisées et micro-services de la plateforme sont hébergés au sein de centres de données hautement certifiés <strong>Google Cloud Platform (GCP)</strong> (région Europe / Afrique), garantissant une disponibilité permanente de 99.9% et un chiffrement AES-256 de repos et de transit.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">4. Partenaire de Paiement Agréé</h4>
                <p>
                  Les transactions monétaires, règlements d'abonnements et recharges de crédits sont traités et sécurisés par les opérateurs de paiement agréés <strong>PayDunya Sénégal</strong> et <strong>PayTech</strong> (conformément aux normes PCI-DSS et de la Banque Centrale des États de l'Afrique de l'Ouest - BCEAO).
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">5. Propriété Intellectuelle</h4>
                <p>
                  L'ensemble des marques, logos, graphismes, logiciels, interfaces et algorithmes d'orchestration multi-agents composant SMG Flow sont la propriété exclusive de SMG Flow SAS. Toute reproduction totale ou partielle non autorisée constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
                </p>
              </div>
            </div>
          )}

          {/* CGU & CGV */}
          {activeDoc === 'terms' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl neu-pressed border-l-4 border-emerald-600">
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">Conditions Générales d'Utilisation et de Vente (CGU / CGV)</h3>
                <p>
                  Les présentes conditions régissent l'accès, l'utilisation de la plateforme SMG Flow et la souscription aux formules d'abonnements d'Agents IA conversationnels.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Article 1 — Objet du Service</h4>
                <p>
                  SMG Flow fournit un système logiciel permettant aux professionnels et entreprises d'automatiser leur relation client sur WhatsApp à l'aide d'agents d'intelligence artificielle configurables (prise de commandes, réservations de créneaux, support d'information et émission de factures/devis).
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Article 2 — Tarification et Modalités de Paiement</h4>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                  <li>Les tarifs des abonnements mensuels (STARTER : 12 500 FCFA, PRO : 25 000 FCFA, BUSINESS : 95 000 FCFA) sont libellés en Francs CFA (XOF), toutes taxes comprises.</li>
                  <li>Le règlement est opéré de manière sécurisée via les passerelles certifiées par Mobile Money (Wave, Orange Money, Free Money) ou Carte Bancaire (Visa, Mastercard).</li>
                  <li>L'activation des agents IA et l'allocation des crédits de traitement sont immédiates dès validation de la transaction.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Article 3 — Durée et Résiliation</h4>
                <p>
                  Les abonnements sont souscrits <strong>sans engagement de durée</strong>. L'utilisateur peut interrompre son forfait ou modifier sa formule à tout moment depuis son espace d'administration. La période en cours reste active jusqu'à son échéance normale.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Article 4 — Caractère Numérique & Exécution Immédiate</h4>
                <p>
                  S'agissant d'un service logiciel et de serveurs d'intelligence artificielle alloués en temps réel, l'activation des agents et l'allocation des crédits sont immédiates dès validation du paiement. Les souscriptions et recharges consommées sont fermes et définitives.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Article 5 — Engagements et Responsabilité de l'Utilisateur</h4>
                <p>
                  L'utilisateur s'engage à utiliser le service dans le respect des lois en vigueur. Sont strictement proscrits : le spam, la diffusion de contenus illicites, haineux, frauduleux ou non conformes aux politiques d'utilisation de la messagerie WhatsApp. Tout manquement grave entraîne la suspension immédiate du compte.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Article 6 — Droit Applicable et Juridiction</h4>
                <p>
                  Les présentes conditions sont soumises au droit sénégalais et aux conventions internationales régissant le commerce électronique. Tout différend relatif à leur validité sera soumis aux tribunaux compétents de Dakar après tentative de médiation amiable.
                </p>
              </div>
            </div>
          )}

          {/* CONFIDENTIALITÉ & DONNÉES PERSONNELLES */}
          {activeDoc === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl neu-pressed border-l-4 border-indigo-600">
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">Protection des Données Personnelles (CDP Sénégal & RGPD)</h3>
                <p>
                  SMG Flow applique une politique de stricte confidentialité conforme à la <strong>Loi sénégalaise n° 2008-12 sur la protection des données à caractère personnel</strong> ainsi qu'aux standards internationaux de protection de la vie privée (RGPD).
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">1. Nature des Données Collectées</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Compte entreprise :</strong> Nom commercial, numéro de téléphone WhatsApp de contact, adresse e-mail, identifiant de facturation.</li>
                  <li><strong>Données de messagerie :</strong> Messages échangés avec l'agent IA, exclusivement traités en temps réel pour l'exécution des requêtes du client final (commandes, réservations).</li>
                  <li><strong>Aucune vente de données :</strong> Vos données et celles de vos clients ne sont jamais commercialisées, louées ou cédées à des tiers.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">2. Sécurité & Chiffrement</h4>
                <p>
                  Les flux de données sont chiffrés de bout en bout selon le protocole standard <strong>TLS 1.3</strong>. Les secrets applicatifs et données d'entreprise sensibles sont isolés dans des coffres numériques cryptés en <strong>AES-256 bits</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">3. Droits des Utilisateurs (Accès, Rectification, Suppression)</h4>
                <p>
                  Conformément à la réglementation de la Commission des Données Personnelles (CDP) et au RGPD, vous disposez d'un droit d'accès, d'opposition, de rectification et d'effacement complet (« droit à l'oubli ») de vos informations. Pour exercer ce droit, il suffit d'adresser un simple e-mail à : <strong>contact@smgflow.pro</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">4. Cookies et Traceurs</h4>
                <p>
                  Notre application utilise uniquement des cookies techniques strictement nécessaires au maintien de la session sécurisée et à l'authentification. Aucun traceur publicitaire intrusif n'est déployé.
                </p>
              </div>
            </div>
          )}

          {/* SÉCURITÉ & PAIEMENTS */}
          {activeDoc === 'security' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl neu-pressed border-l-4 border-sky-600">
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">Sécurité Bancaire & Moyens de Paiement Certifiés</h3>
                <p>
                  Vos transactions financières bénéficient du niveau de protection le plus élevé de l'industrie numérique.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl neu-flat space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Agrément PayDunya & PayTech Sénégal</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Conformité stricte PCI-DSS Niveau 1 et protocoles 3D-Secure pour les cartes de crédit internationales.
                  </p>
                </div>

                <div className="p-4 rounded-2xl neu-flat space-y-2">
                  <div className="flex items-center gap-2 text-sky-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mobile Money Officiel</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Intégration directe des passerelles Wave, Orange Money et Free Money avec validation par code OTP sécurisé.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Chiffrement & Non-Stockage des Numéros de Carte</h4>
                <p>
                  SMG Flow ne stocke à aucun moment vos coordonnées bancaires (numéros de carte, cryptogrammes ou codes PIN de mobile money). Les flux financiers sont traités directement dans l'environnement hautement sécurisé des partenaires de paiement.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#D1D9E6] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#E2E8F0]/30">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Document contractuel opposable • Version 2026.1 • SMG Flow</span>
          </div>

          <button
            onClick={onClose}
            className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md hover:scale-102 transition-transform"
          >
            J'ai compris et j'accepte
          </button>
        </div>
      </div>
    </div>
  );
};
