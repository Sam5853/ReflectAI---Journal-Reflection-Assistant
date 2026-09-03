import { Interaction } from '../types';

export function getSeedInteractions(userId: string): Interaction[] {
  const now = Date.now();
  return [
    {
      id: 'seed-entry-1',
      userId,
      title: 'Morning Fog & Japanese Tea Garden',
      mode: 'reflection',
      location: {
        lat: 37.7700,
        lng: -122.4701,
        name: 'Japanese Tea Garden, San Francisco',
        address: '75 Hagiwara Tea Garden Dr, San Francisco, CA 94118',
        accuracy: 15,
      },
      messages: [
        {
          id: 'msg-1-1',
          role: 'user',
          content: 'Sitting beside the koi pond as the morning fog gently rolls through the pines. Feeling the weight of the upcoming deadlines, but the slow rippling water is urging me to breathe.',
          timestamp: new Date(now - 86400000 * 2).toISOString(),
        },
        {
          id: 'msg-1-2',
          role: 'model',
          content: 'Notice how the fog does not rush to clear itself; it simply drifts, cloaking the garden until the warmth allows it to lift naturally. Can you grant your current work the same patience? What is one pressure point right now that you could release from your immediate control?',
          timestamp: new Date(now - 86400000 * 2 + 5000).toISOString(),
          modelUsed: 'gemini-3.6-flash',
        },
        {
          id: 'msg-1-3',
          role: 'user',
          content: 'The pressure to have every slide finalized by noon. If I focus on just the architecture narrative first, the details will fall into place without panic.',
          timestamp: new Date(now - 86400000 * 2 + 60000).toISOString(),
        },
        {
          id: 'msg-1-4',
          role: 'model',
          content: 'That shift—from defending against everything at once to nurturing the core spine—is the essence of clarity. As you watch the koi glide smoothly, take one steady breath and carry this centered focus with you.',
          timestamp: new Date(now - 86400000 * 2 + 65000).toISOString(),
          modelUsed: 'gemini-3.6-flash',
        },
      ],
      summary: 'Focused on relinquishing artificial urgency and prioritizing foundational narrative architecture over superficial polish.',
      createdAt: new Date(now - 86400000 * 2).toISOString(),
      updatedAt: new Date(now - 86400000 * 2 + 65000).toISOString(),
    },
    {
      id: 'seed-entry-2',
      userId,
      title: 'Belvedere Castle Evening Perspective',
      mode: 'summary',
      location: {
        lat: 40.7829,
        lng: -73.9654,
        name: 'Belvedere Castle, Central Park, New York',
        address: 'Central Park, New York, NY 10024',
        accuracy: 20,
      },
      messages: [
        {
          id: 'msg-2-1',
          role: 'user',
          content: 'Looking over the Great Lawn as dusk arrives. The city skyline is glowing, but up here on the stone terrace, there is a quiet sanctuary. Reflecting on team dynamics and finding harmony between high speed and mental sanity.',
          timestamp: new Date(now - 86400000).toISOString(),
        },
        {
          id: 'msg-2-2',
          role: 'model',
          content: 'From this elevated vantage point, individual commotion dissolves into an orderly rhythm. When building systems or leading teams, maintaining that high-tower perspective protects you from being swept into transient crises.',
          timestamp: new Date(now - 86400000 + 4000).toISOString(),
          modelUsed: 'gemini-3.6-flash',
        },
      ],
      summary: 'Synthesized the balance between high-velocity engineering delivery and emotional equilibrium through structural delegation.',
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 86400000 + 4000).toISOString(),
    },
    {
      id: 'seed-entry-3',
      userId,
      title: 'Shinjuku Twilight & Focus Horizons',
      mode: 'brainstorm',
      location: {
        lat: 35.6595,
        lng: 139.7005,
        name: 'Shibuya Crossing, Tokyo',
        address: 'Shibuya City, Tokyo 150-0043, Japan',
        accuracy: 10,
      },
      messages: [
        {
          id: 'msg-3-1',
          role: 'user',
          content: 'Amidst millions of crosswalk footsteps, I am contemplating the architecture of our cloud intelligence pipeline. How do we keep user data completely sovereign while enabling AI assistance?',
          timestamp: new Date(now - 3600000 * 5).toISOString(),
        },
        {
          id: 'msg-3-2',
          role: 'model',
          content: 'In high-density environments, sovereignty is maintained through strict structural boundaries—much like pedestrian corridors. In software, this means zero-knowledge tenant partitions (/users/{uid}), client-side credential secrecy, and ephemeral LLM context that terminates immediately after synthesis.',
          timestamp: new Date(now - 3600000 * 5 + 3000).toISOString(),
          modelUsed: 'gemini-3.6-flash',
        },
      ],
      summary: 'Brainstormed zero-knowledge tenant boundaries and ephemeral LLM context lifetimes to guarantee privacy-first data handling.',
      createdAt: new Date(now - 3600000 * 5).toISOString(),
      updatedAt: new Date(now - 3600000 * 5 + 3000).toISOString(),
    },
    {
      id: 'seed-entry-4',
      userId,
      title: 'Arashiyama Bamboo Grove Wind & Action',
      mode: 'action_items',
      location: {
        lat: 35.0165,
        lng: 135.6713,
        name: 'Arashiyama Bamboo Forest, Kyoto',
        address: 'Ukyo Ward, Kyoto, 616-8394, Japan',
        accuracy: 12,
      },
      messages: [
        {
          id: 'msg-4-1',
          role: 'user',
          content: 'The bamboo bends in heavy wind without breaking. I want to formulate 3 tangible micro-habits for daily cognitive resilience.',
          timestamp: new Date(now - 3600000 * 2).toISOString(),
        },
        {
          id: 'msg-4-2',
          role: 'model',
          content: 'Here are 3 concrete bamboo-inspired micro-habits:\n1. **Morning Breath Calibration**: 3 minutes of unhurried breathing before touching any screen.\n2. **Location Anchor**: Take 60 seconds whenever changing physical spaces to orient your awareness to your senses.\n3. **Sunset Reflection Ledger**: Record one honest realization every evening to prevent mental backlog.',
          timestamp: new Date(now - 3600000 * 2 + 4000).toISOString(),
          modelUsed: 'gemini-3.6-flash',
        },
      ],
      summary: 'Actionable commitment: Adopted 3 grounding micro-habits (screenless morning breathing, location transitions, evening ledger).',
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      updatedAt: new Date(now - 3600000 * 2 + 4000).toISOString(),
    },
  ];
}
