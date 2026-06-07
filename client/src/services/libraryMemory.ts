import { ALBUMS } from '../data/libraryData';
import { LibraryFavourite, LibraryPlay } from './userActivityApi';

export interface EnrichedLibraryPlay extends LibraryPlay {
  title: string;
  artist: string;
  albumTitle: string;
  albumColor: string;
}

export interface LibrarySummary {
  plays: EnrichedLibraryPlay[];
  totalPlays: number;
  favouriteCount: number;
  totalPlayedSeconds: number;
  topAlbum: string | null;
  recentPlay: EnrichedLibraryPlay | null;
}

const TRACK_INDEX = new Map(
  ALBUMS.flatMap(album => album.tracks.map(track => [
    track.id,
    {
      title: track.title,
      artist: track.artist,
      albumTitle: album.title,
      albumColor: album.color,
    },
  ] as const))
);

export function enrichLibraryPlay(play: LibraryPlay): EnrichedLibraryPlay {
  const track = TRACK_INDEX.get(play.track_id);
  return {
    ...play,
    title: track?.title || play.track_id,
    artist: track?.artist || 'Anahata Library',
    albumTitle: track?.albumTitle || 'Unknown album',
    albumColor: track?.albumColor || '#7048E8',
  };
}

export function summarizeLibraryActivity(plays: LibraryPlay[], favourites: LibraryFavourite[] = []): LibrarySummary {
  const enriched = plays.map(enrichLibraryPlay).sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  const albumCounts: Record<string, number> = {};

  enriched.forEach(play => {
    albumCounts[play.albumTitle] = (albumCounts[play.albumTitle] || 0) + 1;
  });

  const topAlbum = Object.keys(albumCounts).sort((a, b) => albumCounts[b] - albumCounts[a])[0] || null;

  return {
    plays: enriched,
    totalPlays: enriched.length,
    favouriteCount: favourites.length,
    totalPlayedSeconds: enriched.reduce((sum, play) => sum + (play.duration_played || 0), 0),
    topAlbum,
    recentPlay: enriched[0] || null,
  };
}
