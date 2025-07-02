import axios from 'axios';

type SpotifyHeaders = {
  Authorization: string;
  'Content-Type': string;
};

/**
 * Get Current User's Profile
 * https://developer.spotify.com/documentation/web-api/reference/users-profile/get-current-users-profile/
 */
export const getUser = (headers: SpotifyHeaders) =>
  axios.get('https://api.spotify.com/v1/me', { headers });

/**
 * Get User's Followed Artists
 * https://developer.spotify.com/documentation/web-api/reference/follow/get-followed/
 */
export const getFollowing = (headers: SpotifyHeaders) =>
  axios.get('https://api.spotify.com/v1/me/following?type=artist', {
    headers,
  });

/**
 * Get Current User's Recently Played Tracks
 * https://developer.spotify.com/documentation/web-api/reference/player/get-recently-played/
 */
export const getRecentlyPlayed = (headers: SpotifyHeaders) =>
  axios.get('https://api.spotify.com/v1/me/player/recently-played', {
    headers,
  });

/**
 * Get a List of Current User's Playlists
 * https://developer.spotify.com/documentation/web-api/reference/playlists/get-a-list-of-current-users-playlists/
 */
export const getPlaylists = (headers: SpotifyHeaders) =>
  axios.get('https://api.spotify.com/v1/me/playlists', { headers });

/**
 * Get a User's Top Artists
 * https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
 */
export const getTopArtistsShort = (headers: SpotifyHeaders) =>
  axios.get(
    'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term',
    {
      headers,
    }
  );
export const getTopArtistsMedium = (headers: SpotifyHeaders) =>
  axios.get(
    'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term',
    {
      headers,
    }
  );
export const getTopArtistsLong = (headers: SpotifyHeaders) =>
  axios.get(
    'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term',
    { headers }
  );

/**
 * Get a User's Top Tracks
 * https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
 */
export const getTopTracksShort = (headers: SpotifyHeaders) =>
  axios.get(
    'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term',
    { headers }
  );
export const getTopTracksMedium = (headers: SpotifyHeaders) =>
  axios.get(
    'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term',
    {
      headers,
    }
  );
export const getTopTracksLong = (headers: SpotifyHeaders) =>
  axios.get(
    'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term',
    { headers }
  );

/**
 * Get an Artist
 * https://developer.spotify.com/documentation/web-api/reference/artists/get-artist/
 */
export const getArtist = (
  artistId: string,
  headers: SpotifyHeaders
) =>
  axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers,
  });

/**
 * Follow an Artist
 * https://developer.spotify.com/documentation/web-api/reference/follow/follow-artists-users/
 */
export const followArtist = (
  artistId: string,
  headers: SpotifyHeaders
) => {
  const url = `https://api.spotify.com/v1/me/following?type=artist&ids=${artistId}`;
  return axios({ method: 'put', url, headers });
};

/**
 * Check if Current User Follows Artists
 * https://developer.spotify.com/documentation/web-api/reference/follow/follow-artists-users/
 */
export const doesUserFollowArtist = (
  artistId: string,
  headers: SpotifyHeaders
) =>
  axios.get(
    `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
    {
      headers,
    }
  );

/**
 * Check if Users Follow a Playlist
 * https://developer.spotify.com/documentation/web-api/reference/follow/follow-artists-users/
 */
export const doesUserFollowPlaylist = (
  playlistId: string,
  userId: string,
  headers: SpotifyHeaders
) =>
  axios.get(
    `https://api.spotify.com/v1/playlists/${playlistId}/followers/contains?ids=${userId}`,
    {
      headers,
    }
  );

/**
 * Create a Playlist (The playlist will be empty until you add tracks)
 * https://developer.spotify.com/documentation/web-api/reference/playlists/create-playlist/
 */
export const createPlaylist = (
  userId: string,
  name: string,
  headers: SpotifyHeaders
) => {
  const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
  const data = JSON.stringify({ name });
  return axios({ method: 'post', url, headers, data });
};

/**
 * Add Tracks to a Playlist
 * https://developer.spotify.com/documentation/web-api/reference/playlists/add-tracks-to-playlist/
 */
export const addTracksToPlaylist = (
  playlistId: string,
  uris: string,
  headers: SpotifyHeaders
) => {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${uris}`;
  return axios({ method: 'post', url, headers });
};

/**
 * Follow a Playlist
 * https://developer.spotify.com/documentation/web-api/reference/follow/follow-playlist/
 */
export const followPlaylist = (
  playlistId: string,
  headers: SpotifyHeaders
) => {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/followers`;
  return axios({ method: 'put', url, headers });
};

/**
 * Get a Playlist
 * https://developer.spotify.com/documentation/web-api/reference/playlists/get-playlist/
 */
export const getPlaylist = (
  playlistId: string,
  headers: SpotifyHeaders
) =>
  axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers,
  });

/**
 * Get a Playlist's Tracks
 * https://developer.spotify.com/documentation/web-api/reference/playlists/get-playlists-tracks/
 */
export const getPlaylistTracks = (
  playlistId: string,
  headers: SpotifyHeaders
) =>
  axios.get(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    { headers }
  );

/**
 * Return a comma separated string of track IDs from the given array of tracks
 */
const getTrackIds = (tracks: any[]) =>
  tracks.map((track) => track.id).join(',');

/**
 * Get Audio Features for Several Tracks
 * https://developer.spotify.com/documentation/web-api/reference/tracks/get-several-audio-features/
 */
export const getAudioFeaturesForTracks = (
  tracks: any[],
  headers: SpotifyHeaders
) => {
  const ids = getTrackIds(tracks);
  return axios.get(
    `https://api.spotify.com/v1/audio-features?ids=${ids}`,
    { headers }
  );
};

/**
 * Get Recommendations Based on Seeds
 * https://developer.spotify.com/documentation/web-api/reference/browse/get-recommendations/
 */
export const getRecommendationsForTracks = (
  tracks: any[],
  headers: SpotifyHeaders
) => {
  const shuffledTracks = tracks.sort(() => 0.5 - Math.random());
  const seed_tracks = getTrackIds(shuffledTracks.slice(0, 5));
  const seed_artists = '';
  const seed_genres = '';

  return axios.get(
    `https://api.spotify.com/v1/recommendations?seed_tracks=${seed_tracks}&seed_artists=${seed_artists}&seed_genres=${seed_genres}`,
    {
      headers,
    }
  );
};

/**
 * Get a Track
 * https://developer.spotify.com/documentation/web-api/reference/tracks/get-track/
 */
export const getTrack = (trackId: string, headers: SpotifyHeaders) =>
  axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers,
  });

/**
 * Get Audio Analysis for a Track
 * https://developer.spotify.com/documentation/web-api/reference/tracks/get-audio-analysis/
 */
export const getTrackAudioAnalysis = (
  trackId: string,
  headers: SpotifyHeaders
) =>
  axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
    headers,
  });

/**
 * Get Audio Features for a Track
 * https://developer.spotify.com/documentation/web-api/reference/tracks/get-audio-features/
 */
export const getTrackAudioFeatures = (
  trackId: string,
  headers: SpotifyHeaders
) =>
  axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers,
  });

export const getUserInfo = (headers: SpotifyHeaders) =>
  axios
    .all([
      getUser(headers),
      getFollowing(headers),
      getPlaylists(headers),
      getTopArtistsLong(headers),
      getTopTracksLong(headers),
      getTopArtistsMedium(headers),
      getTopTracksMedium(headers),
      getTopArtistsShort(headers),
      getTopTracksShort(headers),
      getRecentlyPlayed(headers),
    ])
    .then(
      axios.spread(
        (
          user,
          followedArtists,
          playlists,
          topArtistsLong,
          topTracksLong,
          topArtistsMedium,
          topTracksMedium,
          topArtistsShort,
          topTracksShort,
          recentlyPlayed
        ) => ({
          user: user.data,
          followedArtists: followedArtists.data,
          playlists: playlists.data,
          topArtistsLong: topArtistsLong.data,
          topTracksLong: topTracksLong.data,
          topArtistsMedium: topArtistsMedium.data,
          topTracksMedium: topTracksMedium.data,
          topArtistsShort: topArtistsShort.data,
          topTracksShort: topTracksShort.data,
          recentlyPlayed: recentlyPlayed.data,
        })
      )
    );

export const getTrackInfo = (
  trackId: string,
  headers: SpotifyHeaders
) =>
  axios
    .all([
      getTrack(trackId, headers),
      getTrackAudioAnalysis(trackId, headers),
      getTrackAudioFeatures(trackId, headers),
    ])
    .then(
      axios.spread((track, audioAnalysis, audioFeatures) => ({
        track: track.data,
        audioAnalysis: audioAnalysis.data,
        audioFeatures: audioFeatures.data,
      }))
    );







export const buildSpotifyProfile = async (headers: SpotifyHeaders) => {


      const spotifyStats = await getUserInfo(headers);

      const spotifyUser = spotifyStats.user;

      const userInfo = {
        spotifyId: spotifyUser.id,
        country: spotifyUser.country,
        displayName: spotifyUser.display_name,
        spotifyProfileUrl: spotifyUser.external_urls.spotify,
        avatarUrl: spotifyUser.images?.[0]?.url,
        email: spotifyUser.email,
        followers: spotifyUser.followers?.total,
        following: spotifyStats.followedArtists.artists.total || 0,
        premium: spotifyUser.product === 'premium' ? true : false, // if premium, user.product is premium, else free
      };

      const playlists = spotifyStats.playlists;
      const playlistsInfo = {
        total: playlists.total,
        items: playlists.items.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          imageUrl: playlist.images?.[0]?.url,
          tracks: playlist.tracks?.total || 0,
          url: playlist.external_urls.spotify,
          public: playlist.public || false,
        })),
      };

      const topArtistsLong = spotifyStats.topArtistsLong;
      const topArtistsShort = spotifyStats.topArtistsShort;
      const topArtistsMedium = spotifyStats.topArtistsMedium;
      const topArtistsInfo = {
        long: topArtistsLong.items.map((artist: any) => {
          return {
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images?.[0]?.url,
            popularity: artist.popularity,
            url: artist.external_urls.spotify,
            followers: artist.followers?.total || 0,
          };
        }),
        short: topArtistsShort.items.map((artist: any) => {
          return {
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images?.[0]?.url,
            popularity: artist.popularity,
            url: artist.external_urls.spotify,
            followers: artist.followers?.total || 0,
          };
        }),
        medium: topArtistsMedium.items.map((artist: any) => {
          return {
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images?.[0]?.url,
            popularity: artist.popularity,
            url: artist.external_urls.spotify,
            followers: artist.followers?.total || 0,
          };
        }),
      };

      const topTracksLong = spotifyStats.topTracksLong;
      const topTracksShort = spotifyStats.topTracksShort;
      const topTracksMedium = spotifyStats.topTracksMedium;
      const topTracksInfo = {
        long: topTracksLong.items.map((track: any) => {
          return {
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist: any) => ({
              id: artist.id,
              name: artist.name,
              url: artist.external_urls.spotify,
            })),
            album: {
              id: track.album.id,
              name: track.album.name,
              imageUrl: track.album.images?.[0]?.url,
              url: track.album.external_urls.spotify,
              releaseDate: track.album.release_date,
            },
            popularity: track.popularity,
            durationMs: track.duration_ms,
            url: track.external_urls.spotify,
          };
        }),
        short: topTracksShort.items.map((track: any) => {
          return {
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist: any) => ({
              id: artist.id,
              name: artist.name,
              url: artist.external_urls.spotify,
            })),
            album: {
              id: track.album.id,
              name: track.album.name,
              imageUrl: track.album.images?.[0]?.url,
              url: track.album.external_urls.spotify,
              releaseDate: track.album.release_date,
            },
            popularity: track.popularity,
            durationMs: track.duration_ms,
            url: track.external_urls.spotify,
          };
        }),
        medium: topTracksMedium.items.map((track: any) => {
          return {
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist: any) => ({
              id: artist.id,
              name: artist.name,
              url: artist.external_urls.spotify,
            })),
            album: {
              id: track.album.id,
              name: track.album.name,
              imageUrl: track.album.images?.[0]?.url,
              url: track.album.external_urls.spotify,
              releaseDate: track.album.release_date,
            },
            popularity: track.popularity,
            durationMs: track.duration_ms,
            url: track.external_urls.spotify,
          };
        }),
      };

      const recentlyPlayed = spotifyStats.recentlyPlayed;
      const recentlyPlayedInfo = {
        total: recentlyPlayed.limit,
        items: recentlyPlayed.items.map((item: any) => ({
          trackName: item.track.name,
          trackId: item.track.id,
          trackUrl: item.track.external_urls.spotify,
          durationMs: item.track.duration_ms,
          playedAt: new Date(item.played_at),
          imageUrl: item.track.album.images?.[0]?.url,
        })),
      };

      const followedArtists = spotifyStats.followedArtists.artists;
      const followedArtistsInfo = {
        total: followedArtists.total,
        items: followedArtists.items.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.images?.[0]?.url,
          url: artist.external_urls.spotify,
          followers: artist.followers?.total || 0,
          popularity: artist.popularity,
        })),
      };

      // const audioFeaturesLong = await getAudioFeaturesForTracks(
      //   topTracksInfo.long.slice(0, 3),
      //   {
      //     Authorization: `Bearer ${tokens.accessToken}`,
      //     'Content-Type': 'application/json',
      //   }
      // );
      // const audioFeaturesShort = await getAudioFeaturesForTracks(
      //   topTracksInfo.short,
      //   {
      //     Authorization: `Bearer ${tokens.accessToken}`,
      //     'Content-Type': 'application/json',
      //   }
      // );
      // const audioFeaturesMedium = await getAudioFeaturesForTracks(
      //   topTracksInfo.medium,
      //   {
      //     Authorization: `Bearer ${tokens.accessToken}`,
      //     'Content-Type': 'application/json',
      //   }
      // );

      // console.log(
      //   'Audio Features Long:',
      //   JSON.stringify(audioFeaturesLong)
      // );



      return {
        userInfo,
        playlistsInfo,
        topArtistsInfo,
        topTracksInfo,
        recentlyPlayedInfo,
        followedArtistsInfo,
        // audioFeaturesInfo,
      }
}