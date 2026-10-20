import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." path="/api/workouts/suggestions/mona@example.com" emptyText="No workout suggestions available." />;
}
