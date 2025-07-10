// In-memory room management (no DB persistence)
export interface JammingRoom {
  roomId: string;
  hostId: string;
  name: string;
  hostSpotifyId: string;
  members: Array<{
    userId: string;
    spotifyId: string;
    displayName: string;
    avatarUrl: string;
    publicSlug: string;
  }>;
  currentTrack?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    spotifyUrl: string;
    durationMs: number;
  };
  playbackState: {
    isPlaying: boolean;
    positionMs: number;
    lastUpdated: Date;
  };
  createdAt: Date;
  isPublic: boolean;
}

// In-memory storage
export class RoomManager {
  private static rooms = new Map<string, JammingRoom>();

  static createRoom(roomId: string, host: { userId: string; spotifyId: string; displayName: string; avatarUrl: string; publicSlug: string; name: string, isPublic: boolean }): JammingRoom {
    console.log(`RoomManager: Creating room ${roomId} with host ${host.displayName}`);
    const room: JammingRoom = {
      roomId,
      name: host.name,
      hostId: host.userId,
      hostSpotifyId: host.spotifyId,
      members: [host],
      playbackState: {
        isPlaying: false,
        positionMs: 0,
        lastUpdated: new Date(),
      },
      createdAt: new Date(),
      isPublic: host.isPublic,
    };

    this.rooms.set(roomId, room);
    console.log(`RoomManager: Room ${roomId} created, total rooms: ${this.rooms.size}`);
    return room;
  }

  static getRoom(roomId: string): JammingRoom | undefined {
    const room = this.rooms.get(roomId);
    console.log(`RoomManager: Getting room ${roomId}, found: ${!!room}, total rooms: ${this.rooms.size}`);
    return room;
  }

  static joinRoom(roomId: string, user: { userId: string; spotifyId: string; displayName: string; avatarUrl: string; publicSlug: string }): JammingRoom | undefined {
    console.log(`RoomManager: Attempting to join room ${roomId} with user ${user.displayName}`);
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(`RoomManager: Room ${roomId} not found for joining`);
      return undefined;
    }

    // Check if user already in room
    const existingMember = room.members.find(m => m.userId === user.userId);
    if (!existingMember) {
      room.members.push(user);
      console.log(`RoomManager: Added ${user.displayName} to room ${roomId}, now has ${room.members.length} members`);
    } else {
      console.log(`RoomManager: ${user.displayName} already in room ${roomId}`);
    }

    return room;
  }

  static leaveRoom(roomId: string, userId: string): { room: JammingRoom | null; roomEnded: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { room: null, roomEnded: false };

    // Remove user from members
    room.members = room.members.filter(m => m.userId !== userId);

    // If host leaves, end the room
    if (room.hostId === userId) {
      this.rooms.delete(roomId);
      return { room: null, roomEnded: true };
    }

    // If no members left, end the room
    if (room.members.length === 0) {
      this.rooms.delete(roomId);
      return { room: null, roomEnded: true };
    }

    return { room, roomEnded: false };
  }

  static updatePlaybackState(roomId: string, playbackState: Partial<JammingRoom['playbackState']>): JammingRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.playbackState = {
      ...room.playbackState,
      ...playbackState,
      lastUpdated: new Date(),
    };

    return room;
  }

  static setCurrentTrack(roomId: string, track: JammingRoom['currentTrack']): JammingRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.currentTrack = track;
    return room;
  }

  static getAllRooms(): JammingRoom[] {
    return Array.from(this.rooms.values());
  }

  static getRoomsMap():  Map<string, JammingRoom> {
    return this.rooms
  }

  static getRoomCount(): number {
    return this.rooms.size;
  }
}