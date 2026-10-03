import { GoogleGenAI, Type } from "@google/genai";
import { db } from "./db.ts";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  if (!aiInstance) {
    try {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.warn("[Gemini AI] Initialization notice:", err);
      return null;
    }
  }
  return aiInstance;
}

export async function getAIStatus(companyId = "c-smgflow-default", agentId?: string) {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  const ctx = await db.getAgentContext(companyId, agentId);
  return {
    installed: true,
    engine: "Google Gemini AI (@google/genai)",
    primaryModel: "gemini-3.8-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    role: "Répondeur Automatique WhatsApp & Multi-Canal 24/7",
    hasApiKey: hasKey,
    activeAgent: ctx.agentName,
    activeCompany: ctx.companyName,
    responseLatencySeconds: ctx.responseLatencySeconds || 10,
    rulesCount: ctx.strictRules?.length || 0,
    documentsCount: ctx.documents?.length || 0,
    knowledgeLength: (ctx.knowledgeBase || ctx.documentsContext || "").length
  };
}

export interface AgentChatOverrides {
  agentId?: string;
  agentName?: string;
  roleType?: string;
  instructions?: string;
  knowledgeText?: string;
}

function searchKnowledgeSnippets(query: string, knowledge: string): string {
  if (!knowledge || !query) return "";
  const stopWords = new Set([
    "bonjour", "salut", "hello", "bonsoir", "svp", "merci", "quel", "quelle", "quels", "quelles",
    "est", "sont", "les", "des", "une", "pour", "dans", "avec", "sur", "que", "qui", "comment",
    "combien", "vous", "nous", "avoir", "faire", "plus", "moins", "votre", "notre"
  ]);
  const keywords = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (keywords.length === 0) return "";

  const lines = knowledge.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const scored: Array<{ line: string; score: number }> = [];

  for (const line of lines) {
    const normLine = line
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let score = 0;
    for (const kw of keywords) {
      if (normLine.includes(kw)) score += 1;
    }
    if (score > 0) {
      scored.push({ line, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, 4)
    .map((s) => s.line)
    .join("\n");
}

export async function generateAIResponse(
  userMessage: string,
  companyId = "c-smgflow-default",
  senderId?: string,
  overrides?: AgentChatOverrides
): Promise<string> {
  const ctx = await db.getAgentContext(companyId, overrides?.agentId);
  const cleanMsg = (userMessage || "").trim().slice(0, 4000);
  await db.recordAIConversationUsage(companyId, 1);

  const activeAgentName = overrides?.agentName || ctx.agentName || "Nova";
  const activeRoleType = overrides?.roleType || ctx.roleType || "general";
  const customDocs = (overrides?.knowledgeText || ctx.knowledgeBase || ctx.documentsContext || "").slice(0, 180000);
  const customInstructions = (overrides?.instructions || ctx.customInstructions || ctx.instructions || "").slice(0, 50000);

  // Rôle de l'agent tout en ayant accès à 100% des données du Dashboard
  let roleDirective = "";
  if (activeRoleType === "customer_service") {
    roleDirective = `
# SPÉCIALITÉ PRINCIPALE : SERVICE CLIENT, RENSEIGNEMENTS & ASSISTANCE
- Tu es l'agent « ${activeAgentName} » dédié au Service Client, à l'information et au suivi de "${ctx.companyName}".
- Tu connais et utilises TOUTES les informations présentes dans le Tableau de Bord ci-dessous (Catalogue produits & prix en FCFA, disponibilité des stocks, suivi des commandes CMD-..., suivi des réservations RES-..., créneaux d'agenda, factures FAC-..., horaires, documents et règles).
- Si un client demande le prix d'un produit, le stock, les horaires, le statut d'une commande, d'une réservation ou d'une facture : donne-lui la réponse exacte issue des données du Tableau de Bord.
`;
  } else if (activeRoleType === "sales_orders") {
    roleDirective = `
# SPÉCIALITÉ PRINCIPALE : PRISE DE COMMANDES, CATALOGUE & VENTES
- Tu es l'agent « ${activeAgentName} » dédié aux Ventes, au Catalogue et aux Commandes de "${ctx.companyName}".
- Consulte la section CATALOGUE PRODUITS & STOCKS du Tableau de Bord pour indiquer les prix exacts en FCFA, vérifier si un article est Disponible ou en Rupture, calculer le total du panier et proposer le paiement Wave ou Orange Money.
- Tu peux aussi renseigner le client sur l'état de ses commandes (CMD-...) et factures (FAC-...).
`;
  } else if (activeRoleType === "reservations") {
    roleDirective = `
# SPÉCIALITÉ PRINCIPALE : RÉSERVATIONS & AGENDA DE RENDEZ-VOUS
- Tu es l'agent « ${activeAgentName} » dédié aux Réservations et à l'Agenda de "${ctx.companyName}".
- Consulte les sections RÉSERVATIONS et CRÉNEAUX D'AGENDA du Tableau de Bord pour vérifier les disponibilités ou confirmer une réservation existante, et demande la date, l'heure, le nombre de personnes et le nom du client.
`;
  } else if (activeRoleType === "tech_support") {
    roleDirective = `
# SPÉCIALITÉ PRINCIPALE : SUPPORT TECHNIQUE & DÉPANNAGE
- Tu es l'agent « ${activeAgentName} » de Support Technique de "${ctx.companyName}".
- Aide le client pas à pas en t'appuyant sur la documentation, le catalogue et les règles du Tableau de Bord.
`;
  }

  const rulesList =
    ctx.strictRules && ctx.strictRules.length > 0
      ? ctx.strictRules.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")
      : "- Répondre avec précision, courtoisie et efficacité en respectant toutes les données du Tableau de Bord.";

  const systemInstruction = `# IDENTITÉ DE L'AGENT
Tu es « ${activeAgentName} », agent IA officiel de l'entreprise "${ctx.companyName}".
Tu réponds aux clients sur WhatsApp en te basant sur l'INTÉGRALITÉ des données en temps réel du Tableau de Bord Entreprise ci-dessous (Base de connaissances, Documents, Catalogue Produits & Stocks, Commandes, Réservations, Agenda, Factures, CRM et Instructions).

${roleDirective}

# IDENTITÉ DE L'ENTREPRISE
- Entreprise : ${ctx.companyName}
- Secteur : ${ctx.industry || "Commerce et Services"}
- Horaires : ${ctx.openingHours || "Lundi au Samedi 9h-19h"}
- Localisation : ${ctx.address || "Dakar, Sénégal"}
- Politique tarifaire : ${ctx.pricingRules || "Tarifs transparents TTC en FCFA"}
- Contact Escalade : ${ctx.personalContactName || "La direction"} (${ctx.personalContactPhone || "numéro interne"})

# DONNÉES COMPLÈTES DU TABLEAU DE BORD & BASE DE CONNAISSANCES (SOURCE DE VÉRITÉ PRIORITAIRE)
${customDocs || "Aucune donnée spécifique."}

# INSTRUCTIONS & CHANGEMENTS APPLIQUÉS PAR L'ADMINISTRATEUR
${customInstructions || "Sois poli, concis et serviable."}

# RÈGLES D'OR ACTIVES DU TABLEAU DE BORD
${rulesList}

# FORMAT WHATSAPP OBLIGATOIRE
1. Réponses courtes, humaines, précises et claires (2 à 5 phrases maximum, style WhatsApp).
2. Utilise TOUJOURS les chiffres, prix en FCFA, stocks, statuts de commandes/réservations/factures, horaires et règles figurant dans les DONNÉES DU TABLEAU DE BORD ci-dessus. N'invente jamais un prix ou un stock qui contredit le tableau de bord.
3. Lorsqu'un commandeur veut payer sa commande (ou demande comment régler par Wave, Orange Money ou autre moyen local), indique-lui le montant total et envoie-lui directement le **Numéro Wave**, le **Numéro Orange Money** et/ou les autres numéros de paiement du pays figurant dans la section « NUMÉROS DE PAIEMENT DE L'ENTREPRISE SELON LE PAYS (BASE DE DONNÉES) ».
4. Mets les éléments importants en *gras* (noms de produits, prix, numéros de paiement Wave / Orange Money, références de commande/facture, dates, horaires).
5. Ne demande JAMAIS de numéro de carte bancaire complet, mot de passe ou code secret par chat.`;

  try {
    const ai = getAI();
    if (ai) {
      const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: cleanMsg,
            config: {
              systemInstruction,
              temperature: 0.2,
            },
          });

          if (response.text && response.text.trim().length > 0) {
            return response.text.trim();
          }
        } catch (modelErr: any) {
          console.warn(`[Gemini AI] Modèle ${modelName} indisponible, essai du suivant...`);
        }
      }
    }
  } catch (error) {
    console.error("[Gemini AI] Erreur génération:", error);
  }

  // Fallback intelligent basé sur l'intégralité des données du tableau de bord
  const matchedSnippets = searchKnowledgeSnippets(cleanMsg, `${customDocs}\n${customInstructions}\n${rulesList}`);
  const lower = cleanMsg.toLowerCase();

  if (matchedSnippets) {
    return `Bonjour ! Ici *${activeAgentName}* (${ctx.companyName}). Voici les informations exactes enregistrées dans notre système :\n\n${matchedSnippets}\n\nSouhaitez-vous plus de précisions ?`;
  }

  if (lower.includes("bonjour") || lower.includes("hello") || lower.includes("salut") || lower.includes("bonsoir")) {
    return `Bonjour et bienvenue chez *${ctx.companyName}* ! Je suis *${activeAgentName}*, votre assistant IA connecté en direct à notre catalogue, nos stocks, nos commandes et nos réservations. En quoi puis-je vous aider aujourd'hui ?`;
  }

  return `Bonjour ! C'est *${activeAgentName}* pour *${ctx.companyName}*. J'ai bien reçu votre message : "${cleanMsg}". Souhaitez-vous consulter nos produits et tarifs, vérifier une commande ou effectuer une réservation ?`;
}

// Assimilation intelligente de documents (PDF, Images, CSV, TXT, MD) par l'IA
export async function assimilateDocumentWithAI(params: {
  fileName: string;
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
  currentKnowledge?: string;
  agentName: string;
  companyName: string;
}): Promise<{
  extractedKnowledge: string;
  mergedKnowledge: string;
  summary: string;
}> {
  const { fileName, textContent, base64Data, mimeType, currentKnowledge = "", agentName, companyName } = params;

  try {
    const ai = getAI();
    if (ai) {
      const parts: any[] = [];
      if (base64Data && mimeType && (mimeType.startsWith("image/") || mimeType === "application/pdf")) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
      parts.push({
        text: `Analyse ce document intitulé "${fileName}" destiné à l'agent IA WhatsApp "${agentName}" de l'entreprise "${companyName}".
${textContent ? `\nContenu texte fourni :\n${textContent.slice(0, 60000)}\n` : ""}
Extrais de manière exhaustive, claire et structurée toutes les informations importantes : produits, services, prix exacts, horaires, conditions, FAQ, adresses, numéros et règles métier.
Renvoie un JSON avec :
- "summary" : résumé court en 1-2 phrases de ce que l'IA vient d'apprendre depuis ce document.
- "extractedKnowledge" : les données structurées extraites du document prêtes pour la base de connaissances RAG.`,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              extractedKnowledge: { type: Type.STRING },
            },
            required: ["summary", "extractedKnowledge"],
          },
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const block = `\n\n=== DOCUMENT INDEXÉ : ${fileName} (${new Date().toLocaleDateString("fr-FR")}) ===\n${parsed.extractedKnowledge}`;
        return {
          extractedKnowledge: parsed.extractedKnowledge,
          mergedKnowledge: `${currentKnowledge.trim()}${block}`.trim(),
          summary: parsed.summary || `Le document "${fileName}" a été analysé et intégré dans la mémoire de ${agentName}.`,
        };
      }
    }
  } catch (err) {
    console.warn("[Assimilate Document AI] Fallback:", err);
  }

  const rawText = (textContent || "").trim();
  const extracted = rawText
    ? rawText.slice(0, 50000)
    : `Document officiel "${fileName}" enregistré dans la base documentaire de ${companyName}.`;
  const block = `\n\n=== DOCUMENT INDEXÉ : ${fileName} (${new Date().toLocaleDateString("fr-FR")}) ===\n${extracted}`;

  return {
    extractedKnowledge: extracted,
    mergedKnowledge: `${currentKnowledge.trim()}${block}`.trim(),
    summary: `Document "${fileName}" indexé et synchronisé avec la mémoire de l'agent ${agentName}.`,
  };
}

// Application directe de changements à la base de connaissances et aux instructions par l'IA
export async function applyAIChangesToAgent(params: {
  changeRequest: string;
  currentKnowledge: string;
  currentPrompt: string;
  agentName: string;
  roleTitle: string;
  companyName: string;
}): Promise<{
  reply: string;
  updatedKnowledge: string;
  updatedPrompt: string;
  changesApplied: string[];
}> {
  const { changeRequest, currentKnowledge, currentPrompt, agentName, roleTitle, companyName } = params;

  const systemInstruction = `Tu es l'ingénieur IA responsable de mettre à jour en temps réel la base de connaissances documentaire ET les instructions de l'agent WhatsApp "${agentName}" (Rôle: ${roleTitle}) pour l'entreprise "${companyName}".
L'administrateur te donne une consigne de modification, un ajout d'information, un changement de tarif, d'horaire, de produit ou de comportement.
Tu dois :
1. Mettre à jour "updatedKnowledge" en intégrant ou modifiant précisément les faits, tarifs, produits, horaires ou règles mentionnés dans la base de connaissances actuelle (sans perdre les informations existantes qui restent valides).
2. Mettre à jour "updatedPrompt" en intégrant toute nouvelle consigne de comportement, de ton ou de règle stricte dans le prompt d'instructions actuel.
3. Fournir "reply" (confirmation claire en français) et "changesApplied" (liste courte des changements effectués).`;

  try {
    const ai = getAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `DEMANDE DE CHANGEMENT DE L'ADMINISTRATEUR :\n"${changeRequest}"\n\nBASE DE CONNAISSANCES ACTUELLE :\n${currentKnowledge || "(vide)"}\n\nPROMPT D'INSTRUCTIONS ACTUEL :\n${currentPrompt || "(vide)"}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              updatedKnowledge: { type: Type.STRING },
              updatedPrompt: { type: Type.STRING },
              changesApplied: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["reply", "updatedKnowledge", "updatedPrompt", "changesApplied"],
          },
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          reply: parsed.reply || "Changements appliqués avec succès à la connaissance et aux instructions de l'agent.",
          updatedKnowledge: parsed.updatedKnowledge || currentKnowledge,
          updatedPrompt: parsed.updatedPrompt || currentPrompt,
          changesApplied: Array.isArray(parsed.changesApplied) ? parsed.changesApplied : [changeRequest],
        };
      }
    }
  } catch (err) {
    console.warn("[Apply AI Changes] Fallback:", err);
  }

  // Fallback déterministe immédiat
  const dateStamp = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const updatedKnowledge = `${currentKnowledge.trim()}\n\n[MISE À JOUR IA (${dateStamp})] :\n- ${changeRequest}`.trim();
  const updatedPrompt = `${currentPrompt.trim()}\n\n# DIRECTIVE MISE À JOUR (${dateStamp})\n- Appliquer strictement : ${changeRequest}`.trim();

  return {
    reply: `J'ai immédiatement mis à jour la base de connaissances et les consignes de ${agentName} avec votre modification : "${changeRequest}". Ce changement est actif en direct sur WhatsApp.`,
    updatedKnowledge,
    updatedPrompt,
    changesApplied: [changeRequest],
  };
}

// Interactive Prompt Guide Copilot
export async function generatePromptFromGuide(params: {
  conversation: Array<{ role: "user" | "assistant"; text: string }>;
  agentRole: string;
  companyName: string;
  currentPrompt?: string;
  currentKnowledge?: string;
}): Promise<{ reply: string; suggestedPrompt?: string; suggestedKnowledge?: string }> {
  const { conversation, agentRole, companyName, currentPrompt, currentKnowledge } = params;

  const conversationText = conversation
    .map((c) => `${c.role === "user" ? "Utilisateur" : "Guide IA"} : ${c.text}`)
    .join("\n");

  const systemInstruction = `Tu es un expert en configuration d'agents IA WhatsApp pour "${companyName}".
Le rôle de l'agent est : "${agentRole}".
L'utilisateur échange avec toi pour définir ou modifier les consignes, les documents de connaissance, les tarifs, le ton et les règles strictes de son agent IA WhatsApp.

Tes objectifs :
1. Répondre clairement en confirmant la prise en compte des changements demandés.
2. Mettre à jour le prompt complet dans "suggestedPrompt" en intégrant toutes les consignes de l'utilisateur.
3. Si l'utilisateur mentionne des faits, prix, produits, horaires ou informations métier, les intégrer également dans "suggestedKnowledge".`;

  try {
    const ai = getAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Voici l'échange jusqu'ici :\n${conversationText}\n\nPrompt actuel :\n${currentPrompt || "(aucun)"}\n\nBase de connaissances actuelle :\n${currentKnowledge || "(aucune)"}\n\nApplique les demandes de l'utilisateur et fournis le prompt et la connaissance mis à jour.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              suggestedPrompt: { type: Type.STRING },
              suggestedKnowledge: { type: Type.STRING },
            },
            required: ["reply", "suggestedPrompt"],
          },
          temperature: 0.3,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          reply: parsed.reply || "Vos modifications ont été intégrées dans le prompt de l'agent !",
          suggestedPrompt: parsed.suggestedPrompt,
          suggestedKnowledge: parsed.suggestedKnowledge,
        };
      }
    }
  } catch (e) {
    console.warn("[Guide Prompt] Erreur Gemini:", e);
  }

  const lastUserMsg = conversation.filter((c) => c.role === "user").pop()?.text || "";
  const fallbackPrompt = `${currentPrompt || `# RÔLE ET OBJECTIF\nTu es l'agent officiel dédié à "${agentRole}" pour "${companyName}".`}\n\n# NOUVELLE CONSIGNE AJOUTÉE\n- ${lastUserMsg}`;

  return {
    reply: "J'ai intégré votre nouvelle consigne directement dans le prompt et la mémoire de l'agent !",
    suggestedPrompt: fallbackPrompt,
    suggestedKnowledge: currentKnowledge
      ? `${currentKnowledge}\n- ${lastUserMsg}`
      : lastUserMsg,
  };
}

export async function assimilateDocumentKnowledge(params: {
  documentTitle: string;
  rawContent: string;
  companyName?: string;
  existingKnowledge?: string;
  agentName?: string;
}): Promise<{
  structuredKnowledge: string;
  summary: string;
  mergedKnowledge: string;
}> {
  const res = await assimilateDocumentWithAI({
    fileName: params.documentTitle,
    textContent: params.rawContent,
    currentKnowledge: params.existingKnowledge || "",
    agentName: params.agentName || "Nova",
    companyName: params.companyName || "Mon Entreprise",
  });
  return {
    structuredKnowledge: res.extractedKnowledge,
    summary: res.summary,
    mergedKnowledge: res.mergedKnowledge,
  };
}

export async function applyLiveChangesWithAI(params: {
  changeDirective: string;
  companyName?: string;
  currentKnowledge: string;
  currentInstructions: string;
  agentName?: string;
  roleTitle?: string;
}): Promise<{
  updatedKnowledge: string;
  updatedInstructions: string;
  summaryOfChanges: string;
  appliedRules: string[];
}> {
  const res = await applyAIChangesToAgent({
    changeRequest: params.changeDirective,
    currentKnowledge: params.currentKnowledge,
    currentPrompt: params.currentInstructions,
    agentName: params.agentName || "Nova",
    roleTitle: params.roleTitle || "Conseiller IA",
    companyName: params.companyName || "Mon Entreprise",
  });
  return {
    updatedKnowledge: res.updatedKnowledge,
    updatedInstructions: res.updatedPrompt,
    summaryOfChanges: res.reply,
    appliedRules: res.changesApplied,
  };
}

