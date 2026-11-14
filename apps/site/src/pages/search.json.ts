// The talks search index: everything the search box looks through, built with
// the site. Read by /talks (src/lib/search.js).
import { talks, transcriptParas, eventName } from '../lib/data';

const seconds = (ts: string) => ts.split(':').reduce((s, n) => s * 60 + Number(n), 0);

export const GET = () =>
  new Response(
    JSON.stringify(
      talks.map((t) => ({
        path: `/talks/${t.id}`,
        title: t.title,
        speaker: t.person.name,
        meetup: eventName(t.event),
        text: [t.summary, ...t.takeaways].join(' '),
        paras: transcriptParas(t).filter((p) => p.at).map((p) => [seconds(p.at), p.text]),
      })),
    ),
    { headers: { 'Content-Type': 'application/json' } },
  );
