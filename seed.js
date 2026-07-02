import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kpdfbgtrsiwzfpxrpsbi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGZiZ3Ryc2l3emZweHJwc2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcyOTcsImV4cCI6MjA5NzM5MzI5N30.OyE6iRgBSZUaRPeAT8N4ywjYU76AV4A70nRLJL8IJ7Y');

const initialArticles = [
  {
    id: 'art-1',
    title: 'The Silent Cabin: Under the Hood of the 2026 Mercedes-Maybach S-Class',
    category: 'Vehicle Review',
    date: 'June 18, 2026',
    readtime: '6 min read',
    summary: 'An in-depth analysis of the active acoustic noise cancellation, air suspension mapping, and rear executive comfort suites defining Maybach’s flagship.',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=400',
    content: `The 2026 Mercedes-Maybach S-Class represents the zenith of modern internal combustion motoring luxury. In our extensive tests, the defining feature remains its near-absolute acoustic isolation. By integrating active noise cancellation directly into the Burmester 4D surround sound speakers, the cabin registers a mere 54 decibels even at highway speeds. 

    Combined with the predictive Magic Body Control air suspension—which scans the road surface ahead 500 times per second using high-definition stereo cameras—passengers in the rear reclining executive seats experience zero lateral sway. Complete with thermodynamic cup holders, bespoke champagne flutes, and hand-stitched Nappa leather pillows, this vehicle elevates executive transport to an art form. Our chauffeurs undergo specialized braking and steering calibrations to guarantee the transit feels completely uninterrupted.`
  },
  {
    id: 'art-2',
    title: 'Chauffeur Etiquette: The Unwritten Codes of Executive Discretion',
    category: 'Chauffeur Culture',
    date: 'May 24, 2026',
    readtime: '4 min read',
    summary: 'Exploring the rigorous protocols, security clearing certificates, and silent communications defining the Reach Chauffeur training program.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400',
    content: `Discretion is not merely a courtesy; it is our primary product. Every professional operating under the Reach banner completes a comprehensive 12-week concierge security training block. This encompasses defense driving protocols, airport runway clearance coordinates, and advanced diplomatic etiquette. 

    Chauffeurs learn to read the room immediately. If a client is on a secure corporate briefing call, the divider partition is raised instantly. Conversation is only initiated when requested, and route changes are performed silently using live traffic telemetry. Each chauffeur is fully cleared by state security bureaus and holds valid credentials for corporate airport private hangars, ensuring your transition from charter flight to luxury cabin is frictionless.`
  }
];

async function seedArticles() {
  await supabase.from('articles').delete().neq('id', 'temp');
  const { error } = await supabase.from('articles').insert(initialArticles);
  if (error) {
    console.error('Error seeding articles:', error);
  } else {
    console.log('Successfully seeded articles!');
  }
}

seedArticles();
