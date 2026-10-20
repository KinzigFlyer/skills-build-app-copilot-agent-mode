import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." path="/api/teams" emptyText="No teams available." />;
}
