import axios from 'axios';

export async function fetchSpotifyStats(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // Fetch top artists
  const topArtistsRes = await axios.get('https://api.spotify.com/v1/me/top/artists?limit=20', { headers });
  console.log("Top Artists")
  console.log(topArtistsRes.data);
  const topArtists = topArtistsRes.data.items.map((artist: any) => artist.name);
  const topGenres = [...new Set(topArtistsRes.data.items.flatMap((artist: any) => artist.genres))];
  console.log("================================================")
  console.log("Recent Tracks")

  // Fetch recently played tracks
  const recentTracksRes = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers });
  console.log(recentTracksRes.data);
  const recentTracks = recentTracksRes.data.items;
  const totalMinutesListened = recentTracks.reduce((sum: number, item: any) => sum + (item.track.duration_ms || 0), 0) / 60000;


  console.log("================================================")
  console.log("Playlists")

  // Fetch playlists
  const playlistsRes = await axios.get('https://api.spotify.com/v1/me/playlists?limit=20', { headers });
  const playlists = playlistsRes.data.items.map((playlist: any) => playlist.name);

  // Fetch followed artists
  const followedRes = await axios.get('https://api.spotify.com/v1/me/following?type=artist&limit=20', { headers });
  const followedArtists = followedRes.data.artists.items.map((artist: any) => artist.name);

  console.log("================================================")
  console.log("Followed Artists")
  console.log(followedArtists)

  

  return {
    topArtists,
    topGenres,
    totalMinutesListened: Math.round(totalMinutesListened),
    playlists,
    followedArtists,
    recentTracks: recentTracks.length,
  };
}