import { UserSpotifyProfile as UserSpotifyProfileType } from '@sonder/types';
import mongoose, { Schema, Document, Types } from 'mongoose';

interface SpotifyProfileDocument
  extends Omit<UserSpotifyProfileType, 'userId'>,
    Document {
  userId: Types.ObjectId;
}

const ArtistSchema = new Schema({
  id: String,
  name: String,
  imageUrl: String,
  url: String,
  followers: Number,
  popularity: Number,
});

const TrackSchema = new Schema({
  id: String,
  name: String,
  artists: [{ id: String, name: String, url: String }],
  album: {
    id: String,
    name: String,
    imageUrl: String,
    url: String,
    releaseDate: String,
  },
  popularity: Number,
  durationMs: Number,
  url: String,
});

const PlaylistSchema = new Schema({
  total: Number,
  items: [
    {
      id: String,
      name: String,
      description: String,
      imageUrl: String,
      tracks: Number,
      url: String,
      public: Boolean,
    },
  ],
});

const UserSpotifyProfileSchema = new Schema<SpotifyProfileDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  spotifyId: String,
  country: String,
  displayName: String,
  spotifyProfileUrl: String,
  avatarUrl: String,
  email: String,
  followers: Number,
  following: Number,
  premium: Boolean,

  playlists: PlaylistSchema,

  topArtists: {
    short: [ArtistSchema],
    medium: [ArtistSchema],
    long: [ArtistSchema],
  },

  topTracks: {
    short: [TrackSchema],
    medium: [TrackSchema],
    long: [TrackSchema],
  },

  recentlyPlayedTracks: {
    total: Number,
    items: [
      {
        trackName: String,
        trackId: String,
        trackUrl: String,
        durationMs: Number,
        playedAt: String,
      },
    ],
  },

  followedArtists: {
    total: Number,
    items: [ArtistSchema],
  },

  audioFeatureSummary: {
    valenceAvg: Number,
    energyAvg: Number,
    danceabilityAvg: Number,
    acousticnessAvg: Number,
    instrumentalnessAvg: Number,
    tempoAvg: Number,
  },

  genreMap: {
    type: Map,
    of: Number,
  },

  lastUpdated: { type: Date, default: Date.now },
});

UserSpotifyProfileSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

export const UserSpotifyProfile =
  mongoose.model<SpotifyProfileDocument>(
    'UserSpotifyProfile',
    UserSpotifyProfileSchema
  );
