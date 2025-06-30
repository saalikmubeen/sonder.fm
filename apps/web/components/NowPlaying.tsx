export default function NowPlaying({ song, artist, albumArt }: { song?: string; artist?: string; albumArt?: string }) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-100 via-pink-100 to-indigo-100 dark:from-blue-900 dark:via-pink-900 dark:to-indigo-900 rounded-xl">
      <div className="w-16 h-16 rounded bg-gray-300 dark:bg-gray-700 overflow-hidden">
        {albumArt ? <img src={albumArt} alt={song} className="w-full h-full object-cover" /> : null}
      </div>
      <div>
        <div className="font-bold text-lg text-gray-900 dark:text-white">{song || "No song playing"}</div>
        <div className="text-gray-600 dark:text-gray-300">{artist || ""}</div>
      </div>
    </div>
  );
}