import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." path="/api/activities" emptyText="No activities available." />;
}
