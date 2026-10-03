import { PlanDefinition } from './types.ts';

export const OFFICIAL_PLANS: Record<string, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Abonnement STARTER (SMG Flow)',
    priceXOF: 12500,
    priceEUR: 19,
    credits: 2500,
    period: 'month'
  },
  pro: {
    id: 'pro',
    name: 'Abonnement PRO Mensuel (SMG Flow)',
    priceXOF: 25000,
    priceEUR: 39,
    credits: 6000,
    period: 'month'
  },
  business: {
    id: 'business',
    name: 'Abonnement BUSINESS Mensuel (SMG Flow)',
    priceXOF: 95000,
    priceEUR: 145,
    credits: 35000,
    period: 'month'
  },
  enterprise_125k: {
    id: 'enterprise_125k',
    name: 'Abonnement ENTREPRISE MULTI-AGENTS (SMG Flow)',
    priceXOF: 125000,
    priceEUR: 190,
    credits: 60000,
    period: 'month'
  },
  pack_1k: {
    id: 'pack_1k',
    name: 'Pack Mini - 1 000 Crédits IA',
    priceXOF: 2500,
    priceEUR: 4,
    credits: 1000,
    period: 'one_time'
  },
  pack_5k: {
    id: 'pack_5k',
    name: 'Pack Basique - 5 000 Crédits IA',
    priceXOF: 7500,
    priceEUR: 11,
    credits: 5000,
    period: 'one_time'
  },
  pack_10k: {
    id: 'pack_10k',
    name: 'Pack Populaire - 10 000 Crédits IA',
    priceXOF: 12000,
    priceEUR: 18,
    credits: 10000,
    period: 'one_time'
  },
  pack_20k: {
    id: 'pack_20k',
    name: 'Pack Avancé - 20 000 Crédits IA',
    priceXOF: 20000,
    priceEUR: 30,
    credits: 20000,
    period: 'one_time'
  },
  pack_50k: {
    id: 'pack_50k',
    name: 'Pack Expert - 50 000 Crédits IA',
    priceXOF: 40000,
    priceEUR: 61,
    credits: 50000,
    period: 'one_time'
  },
  pack_100k: {
    id: 'pack_100k',
    name: 'Pack Pro Max - 100 000 Crédits IA',
    priceXOF: 70000,
    priceEUR: 106,
    credits: 100000,
    period: 'one_time'
  }
};

export function getPlanOrThrow(planId: string): PlanDefinition {
  const plan = OFFICIAL_PLANS[planId];
  if (!plan) {
    throw new Error(`Plan inconnu ou non autorisé : "${planId}"`);
  }
  return plan;
}
