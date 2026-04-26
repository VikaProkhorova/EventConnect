/**
 * Shared mock-user registry. Single source of truth for the prototype.
 *
 * Keys are the strings carried in route params (`/event/:eventId/user/:userId`
 * and `/event/:eventId/chat/:chatId`). The same id is reused as both userId
 * and chatId across the prototype.
 */

import type { StoredPerson } from './chatStore';

export type MockUser = {
  id: string;
  name: string;
  company: string;
  position: string;
  industry: string;
  grade: string;
  image: string;
  /** Multiple topics the person wants to talk about (one bubble per item). */
  wantToTalkAbout: string[];
  description: string;
  interests: string[];
  matchTags: string[];
  email: string;
  linkedin: string;
  telegram: string;
};

export const mockUsers: Record<string, MockUser> = {
  'sarah-johnson': {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    company: 'Figma',
    position: 'Product Designer',
    industry: 'Technology',
    grade: 'Senior',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    wantToTalkAbout: [
      'AI in design tools and automation workflows',
      'Building inclusive design systems',
    ],
    description:
      'Passionate product designer with 6+ years of experience in building user-centered design solutions. Currently exploring the intersection of AI and design tools.',
    interests: [
      'UX Design',
      'Product Strategy',
      'AI & Machine Learning',
      'Design Systems',
      'User Research',
      'Prototyping',
      'Accessibility',
      'Mobile Design',
    ],
    matchTags: ['UX Design', 'Product', 'AI'],
    email: 'sarah.johnson@figma.com',
    linkedin: 'linkedin.com/in/sarahjohnson',
    telegram: '@sarahjohnson',
  },
  '1': {
    id: '1',
    name: 'Michael Chen',
    company: 'Google',
    position: 'Senior Product Manager',
    industry: 'Technology',
    grade: 'Senior',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    wantToTalkAbout: [
      'Building AI-powered product features',
      'Scaling product teams',
      'Data-driven decision making',
    ],
    description:
      'Senior PM with an engineering background. Currently building AI-powered features at Google.',
    interests: [
      'Product Strategy',
      'AI',
      'Data Analytics',
      'Leadership',
      'Hiring',
      'Public Speaking',
      'TypeScript',
    ],
    matchTags: ['Product', 'AI', 'Technology'],
    email: 'michael.chen@google.com',
    linkedin: 'linkedin.com/in/michaelchen',
    telegram: '@mchen',
  },
  '2': {
    id: '2',
    name: 'Emma Rodriguez',
    company: 'Airbnb',
    position: 'UX Research Lead',
    industry: 'Technology',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    wantToTalkAbout: [
      'Quantitative vs qualitative research methods',
      'Running studies at scale',
    ],
    description: 'Mixed-methods research lead at Airbnb.',
    interests: [
      'User Research',
      'Design Thinking',
      'Psychology',
      'UX Design',
      'Workshops',
      'Hiring',
      'Mentorship',
    ],
    matchTags: ['Design', 'Research', 'UX'],
    email: 'emma.rodriguez@airbnb.com',
    linkedin: 'linkedin.com/in/emmarodriguez',
    telegram: '@erodriguez',
  },
  '3': {
    id: '3',
    name: 'James Wilson',
    company: 'Meta',
    position: 'Engineering Manager',
    industry: 'Technology',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    wantToTalkAbout: [
      'Scaling engineering teams',
      'Technical architecture',
      'Mentoring senior engineers',
    ],
    description: 'Eng leader. Distributed systems person.',
    interests: [
      'Engineering Leadership',
      'System Design',
      'Mentorship',
      'Hiring',
      'Public Speaking',
      'AI',
      'TypeScript',
    ],
    matchTags: ['Engineering', 'Leadership', 'Technology'],
    email: 'james.wilson@meta.com',
    linkedin: 'linkedin.com/in/jameswilson',
    telegram: '@jwilson',
  },
  '4': {
    id: '4',
    name: 'Liam Patel',
    company: 'Stratify',
    position: 'Founder & CEO',
    industry: 'Startups',
    grade: 'CXO',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    wantToTalkAbout: [
      'Going from 0 to 1 in B2B SaaS',
      'Fundraising in 2026',
      'Hiring the first 10',
    ],
    description: 'Founder of Stratify. Previously eng lead at Stripe.',
    interests: ['Startups', 'Fundraising', 'Hiring', 'B2B SaaS', 'Leadership', 'Investors', 'Product Strategy'],
    matchTags: ['Startups', 'Fundraising', 'Leadership'],
    email: 'liam@stratify.io',
    linkedin: 'linkedin.com/in/liampatel',
    telegram: '@liampatel',
  },
  '5': {
    id: '5',
    name: 'Maya Park',
    company: 'Spotify',
    position: 'Data Scientist',
    industry: 'Music Tech',
    grade: 'Middle',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    wantToTalkAbout: [
      'Recommendation systems beyond collaborative filtering',
      'Causal inference for product analytics',
    ],
    description: 'DS @ Spotify. Personalization & discovery.',
    interests: ['Machine Learning', 'Data Science', 'Personalization', 'Causal Inference', 'Music', 'Analytics'],
    matchTags: ['ML', 'Data', 'Analytics'],
    email: 'maya.park@spotify.com',
    linkedin: 'linkedin.com/in/mayapark',
    telegram: '@mayapark',
  },
  '6': {
    id: '6',
    name: 'Daniel Kovács',
    company: 'Stripe',
    position: 'Backend Engineer',
    industry: 'Fintech',
    grade: 'Senior',
    image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
    wantToTalkAbout: ['Distributed systems at payment scale', 'Postgres tuning'],
    description: 'Backend @ Stripe. Built parts of the payments core.',
    interests: ['Distributed Systems', 'Postgres', 'TypeScript', 'Performance', 'Reliability', 'Open Source'],
    matchTags: ['Backend', 'Distributed Systems', 'Fintech'],
    email: 'daniel.kovacs@stripe.com',
    linkedin: 'linkedin.com/in/dkovacs',
    telegram: '@dkovacs',
  },
  '7': {
    id: '7',
    name: 'Olivia Nguyen',
    company: 'Notion',
    position: 'Product Marketing Manager',
    industry: 'SaaS',
    grade: 'Senior',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    wantToTalkAbout: [
      'Positioning a horizontal product for verticals',
      'Launch playbooks that ship without burnout',
    ],
    description: 'PMM @ Notion. Owned the AI launch.',
    interests: ['Product Marketing', 'Positioning', 'Launches', 'Storytelling', 'Brand', 'Growth', 'AI'],
    matchTags: ['Marketing', 'Positioning', 'Launches'],
    email: 'olivia@makenotion.com',
    linkedin: 'linkedin.com/in/onguyen',
    telegram: '@onguyen',
  },
  '8': {
    id: '8',
    name: 'Rasmus Lindqvist',
    company: 'Tesla',
    position: 'Hardware Engineer',
    industry: 'Automotive',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    wantToTalkAbout: [
      'Battery cell-to-pack architectures',
      'How software people can collaborate with hardware',
    ],
    description: 'Battery systems @ Tesla. Born and built in Stockholm.',
    interests: ['Hardware', 'Batteries', 'Manufacturing', 'Robotics', 'Sustainability', 'CAD'],
    matchTags: ['Hardware', 'Robotics', 'Sustainability'],
    email: 'rasmus@tesla.com',
    linkedin: 'linkedin.com/in/rasmuslindqvist',
    telegram: '@rasmusl',
  },
  '9': {
    id: '9',
    name: 'Yuki Tanaka',
    company: 'Sequoia Capital',
    position: 'Investor',
    industry: 'Venture Capital',
    grade: 'Head',
    image: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400',
    wantToTalkAbout: ['What I look for in a seed round', 'AI infrastructure trends in 2026'],
    description: 'Partner at Sequoia. Focus: developer tools and AI infra.',
    interests: ['Venture', 'Investing', 'AI Infra', 'Developer Tools', 'Founders', 'Markets'],
    matchTags: ['Investor', 'AI', 'Dev Tools'],
    email: 'yuki@sequoiacap.com',
    linkedin: 'linkedin.com/in/yukitanaka',
    telegram: '@yukit',
  },
  '10': {
    id: '10',
    name: 'Priya Iyer',
    company: 'Vercel',
    position: 'Developer Relations Lead',
    industry: 'Developer Tools',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    wantToTalkAbout: [
      'Measuring developer love',
      'Building DevRel that actually moves adoption',
    ],
    description: 'DevRel @ Vercel. Ex-Stripe.',
    interests: ['DevRel', 'Community', 'OSS', 'Developer Education', 'TypeScript', 'Public Speaking'],
    matchTags: ['DevRel', 'Community', 'OSS'],
    email: 'priya@vercel.com',
    linkedin: 'linkedin.com/in/priyaiyer',
    telegram: '@priyai',
  },
  '11': {
    id: '11',
    name: 'Felix Schmidt',
    company: 'Apple',
    position: 'iOS Engineer',
    industry: 'Consumer Tech',
    grade: 'Senior',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    wantToTalkAbout: ['SwiftUI in production', 'Migrating UIKit codebases incrementally'],
    description: 'iOS @ Apple. SwiftUI nerd.',
    interests: ['iOS', 'Swift', 'Mobile', 'Apple platforms', 'Animations', 'Accessibility'],
    matchTags: ['iOS', 'Swift', 'Mobile'],
    email: 'felix.schmidt@apple.com',
    linkedin: 'linkedin.com/in/felixschmidt',
    telegram: '@felixs',
  },
  '12': {
    id: '12',
    name: 'Camila Reyes',
    company: 'Airbnb',
    position: 'Brand Designer',
    industry: 'Hospitality',
    grade: 'Middle',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    wantToTalkAbout: ['Brand identity for global audiences', 'Where illustration belongs in product'],
    description: 'Brand designer @ Airbnb. Mexico City native.',
    interests: ['Brand Identity', 'Type', 'Illustration', 'Design Systems', 'Hospitality'],
    matchTags: ['Brand', 'Design', 'Identity'],
    email: 'camila@airbnb.com',
    linkedin: 'linkedin.com/in/camilareyes',
    telegram: '@camir',
  },
  '13': {
    id: '13',
    name: 'Nikolai Dmitriev',
    company: 'Anthropic',
    position: 'Research Engineer',
    industry: 'AI Research',
    grade: 'Senior',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    wantToTalkAbout: [
      'Interpretability for production LLMs',
      'Evaluating long-context behavior',
    ],
    description: 'Research engineer @ Anthropic. Mech-interp curious.',
    interests: ['LLMs', 'AI Safety', 'Research', 'Interpretability', 'PyTorch', 'Reading Papers'],
    matchTags: ['AI', 'Research', 'Safety'],
    email: 'nikolai@anthropic.com',
    linkedin: 'linkedin.com/in/ndmitriev',
    telegram: '@ndmitriev',
  },
  '14': {
    id: '14',
    name: 'Zara Hassan',
    company: 'Oura',
    position: 'Senior Product Manager',
    industry: 'Health Tech',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400',
    wantToTalkAbout: ['Wearable data and intervention design', 'Making health insights actionable'],
    description: 'PM @ Oura. Sleep & recovery person.',
    interests: ['Health Tech', 'Wearables', 'Sleep Science', 'Behavioral Change', 'Product'],
    matchTags: ['Health', 'Product', 'Wearables'],
    email: 'zara@ouraring.com',
    linkedin: 'linkedin.com/in/zarahassan',
    telegram: '@zarah',
  },
  '15': {
    id: '15',
    name: 'Diego Fernández',
    company: 'Shopify',
    position: 'Junior Frontend Engineer',
    industry: 'E-commerce',
    grade: 'Junior',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    wantToTalkAbout: ['Breaking into frontend in 2026', 'OSS as a learning loop'],
    description: 'Junior FE @ Shopify. Recently moved from Buenos Aires.',
    interests: ['Frontend', 'React', 'TypeScript', 'OSS', 'Career growth', 'Mentorship'],
    matchTags: ['Frontend', 'Career', 'OSS'],
    email: 'diego.fernandez@shopify.com',
    linkedin: 'linkedin.com/in/diegofernandez',
    telegram: '@diegof',
  },
  'anna-k': {
    id: 'anna-k',
    name: 'Anna K.',
    company: 'Traffie',
    position: 'Marketing Lead',
    industry: 'Marketing',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    wantToTalkAbout: ['AI-driven marketing automation', 'Indie growth experiments'],
    description: 'Growth marketing at Traffie. Loves measurable experiments.',
    interests: ['Marketing', 'AI', 'Growth', 'Analytics', 'Indie Hacking'],
    matchTags: ['Marketing', 'AI', 'Growth'],
    email: 'anna@traffie.com',
    linkedin: 'linkedin.com/in/annak',
    telegram: '@annak',
  },
  'sara-p': {
    id: 'sara-p',
    name: 'Sara P.',
    company: 'Pixel',
    position: 'Design Lead',
    industry: 'Design',
    grade: 'Lead',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    wantToTalkAbout: ['Design systems at scale', 'Component governance models'],
    description: 'Lead designer at Pixel. Building the design system from scratch.',
    interests: ['UX Design', 'Design Systems', 'Tooling', 'Prototyping', 'AI'],
    matchTags: ['Design', 'Systems', 'UX'],
    email: 'sara@pixel.com',
    linkedin: 'linkedin.com/in/sarap',
    telegram: '@sarap',
  },
};

export const FALLBACK_USER_ID = 'sarah-johnson';

export function getUser(id?: string): MockUser {
  if (id && mockUsers[id]) return mockUsers[id];
  return mockUsers[FALLBACK_USER_ID];
}

/**
 * Ordered list of users that can show up in Participants > Match.
 * Sarah is excluded from the candidates pool because she's already a
 * connection in the seed; she's still a valid user (Top Match on Home
 * also points to her in the empty-state baseline).
 */
export const matchCandidateIds: string[] = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
  'anna-k', 'sara-p',
];

export function getMatchCandidates(): MockUser[] {
  return matchCandidateIds
    .map((id) => mockUsers[id])
    .filter((u): u is MockUser => Boolean(u));
}

/**
 * Match score = a deterministic pseudo-random integer in [60, 97].
 *
 * Real overlap-based scoring kept collapsing to small numbers because
 * the demo profile and the candidate registry use slightly different
 * vocabulary. For the prototype we just need plausibly-varied "headline"
 * percentages, so we hash a stable identity off the candidate (id +
 * position + company). Same person → same number across renders.
 *
 * Signature still takes `myProfile` and `myInterests` so call sites
 * don't change; they're unused but kept in case we wire a real ranking
 * later.
 */
type MatchProfile = {
  industry?: string;
  grade?: string;
  position?: string;
};
type MatchCandidate = {
  id?: string;
  interests?: string[];
  matchTags?: string[];
  wantToTalkAbout?: string[];
  industry?: string;
  grade?: string;
  position?: string;
  company?: string;
};

export function computeMatchScore(
  _myProfile: MatchProfile,
  _myInterests: string[],
  candidate: MatchCandidate,
): number {
  const key = `${candidate.id ?? ''}|${candidate.position ?? ''}|${candidate.company ?? ''}`;
  // FNV-1a hash → uniform 0..1, then map to 60..97
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const ratio = (h % 10000) / 10000;
  return 60 + Math.round(ratio * 37);
}

/**
 * Sort candidates descending by match score. Stable: ties keep registry
 * order. With the random-in-range scorer, scores are always ≥60, so the
 * `minScore` filter is effectively a no-op and is kept only for API
 * compatibility.
 */
export function rankCandidatesByMatch<T extends MatchCandidate & { id?: string }>(
  candidates: T[],
  myProfile: MatchProfile,
  myInterests: string[],
  options?: { minScore?: number },
): Array<{ user: T; score: number }> {
  const minScore = options?.minScore ?? 1;
  return candidates
    .map((user, idx) => ({ user, score: computeMatchScore(myProfile, myInterests, user), idx }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map(({ user, score }) => ({ user, score }));
}

/**
 * Convert a full MockUser into the looser StoredPerson used by the
 * sessionStorage buckets (connections / liked / hidden).
 */
export function toStoredPerson(u: MockUser): StoredPerson {
  return {
    id: u.id,
    name: u.name,
    position: u.position,
    company: u.company,
    image: u.image,
    interests: u.interests,
    matchTags: u.matchTags,
    wantToTalkAbout: u.wantToTalkAbout,
  };
}
