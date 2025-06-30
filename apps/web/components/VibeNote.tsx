export default function VibeNote({ note, author }: { note?: string; author?: string }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2">
      <div className="text-gray-800 dark:text-gray-100 italic">{note || "This song made me think of someone I lost."}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{author ? `by ${author}` : "anonymous"}</div>
    </div>
  );
}