import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." path="/api/leaderboard" emptyText="No leaderboard available." />;
}
