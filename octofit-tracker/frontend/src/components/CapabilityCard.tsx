import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  path: string;
  emptyText: string;
};

function normalizeItems(payload: Record<string, unknown>): unknown[] {
  if (!payload || typeof payload !== 'object') return [];
  if ('activities' in payload && Array.isArray(payload.activities)) return payload.activities;
  if ('teams' in payload && Array.isArray(payload.teams)) return payload.teams;
  if ('leaderboard' in payload && Array.isArray(payload.leaderboard)) return payload.leaderboard;
  if ('suggestions' in payload && Array.isArray(payload.suggestions)) return payload.suggestions;
  return [];
}

function renderItem(item: Record<string, unknown>) {
  if ('title' in item && typeof item.title === 'string') return item.title;
  if ('name' in item && typeof item.name === 'string') return item.name;
  if ('teamName' in item && typeof item.teamName === 'string') {
    const totalPoints = 'totalPoints' in item ? ` ${String(item.totalPoints)}` : '';
    return `${item.teamName}${totalPoints}`;
  }
  if ('type' in item && typeof item.type === 'string') return item.type;
  if ('focus' in item && typeof item.focus === 'string') return item.focus;
  const values = Object.values(item).filter((value): value is string | number => typeof value === 'string' || typeof value === 'number');
  return values.join(' ');
}

export function CapabilityCard({ title, description, path, emptyText }: Props) {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    getJson<Record<string, unknown>>(path)
      .then((payload) => {
        if (!active) return;
        setItems(normalizeItems(payload));
      })
      .catch((loadError: Error) => {
        if (!active) return;
        setError(loadError.message || 'Unavailable');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path]);

  const hasContent = items.length > 0;

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{isLoading ? <p role="status">Loading...</p> : error ? <div role="alert">Unable to load {title.toLowerCase()}.</div> : hasContent ? <ul>{items.map((item, index) => <li key={index}>{renderItem(item as Record<string, unknown>)}</li>)}</ul> : <p>{emptyText}</p>}</div></section>;
}
