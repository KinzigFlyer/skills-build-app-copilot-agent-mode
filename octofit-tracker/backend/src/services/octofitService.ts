import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function parseActivityInput(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const teamId = typeof body.teamId === 'string' ? body.teamId : '';
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = Number(body.minutes);

  if (!userId || !teamId || !type || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and minutes'), { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid Mongo ObjectIds'), { status: 400 });
  }

  return { userId, teamId, type, minutes };
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const { userId, teamId, type, minutes } = parseActivityInput(input);

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity references an unknown user or team'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: Math.max(1, Math.round(minutes * 1.5)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

function parseTeamInput(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';
  const rawMembers = Array.isArray(body.members) ? body.members : [];

  if (!name) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  const members = rawMembers.map((member) => {
    if (typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member)) {
      throw Object.assign(new Error('Team members must be valid Mongo ObjectIds'), { status: 400 });
    }
    return member;
  });

  return { name, mascot, members };
}

export async function createTeam(input: unknown) {
  const { name, mascot, members } = parseTeamInput(input);

  const team = await Team.create({
    name,
    mascot,
    members,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    {
      $unwind: '$team',
    },
    {
      $project: {
        teamName: '$team.name',
        totalPoints: 1,
        _id: 0,
      },
    },
    {
      $sort: { totalPoints: -1, teamName: 1 },
    },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = user.fitnessGoal || recentActivity?.type || 'endurance';

  const workout = await Workout.findOne({ focus }).lean();

  if (!workout) {
    const fallback = await Workout.findOne({}).lean();
    if (!fallback) {
      throw Object.assign(new Error('No workout suggestions available'), { status: 404 });
    }
    return [{
      title: fallback.title,
      focus: fallback.focus,
      reason: `Based on your recent activity and goal, this ${fallback.focus} workout is a strong match.`,
    }];
  }

  let reason = `Based on your recent ${recentActivity?.type ?? user.fitnessGoal ?? 'activity'}, this ${workout.focus} workout matches your goal.`;
  if (!recentActivity) {
    reason = `Based on your goal of ${user.fitnessGoal}, this ${workout.focus} workout is a strong match.`;
  }

  return [{
    title: workout.title,
    focus: workout.focus,
    reason,
  }];
}

export { User };
