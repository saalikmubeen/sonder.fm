export default function ThemePicker() {
  return (
    <div className="flex space-x-2">
      <button className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Default</button>
      <button className="px-3 py-1 rounded bg-gray-900 text-white">Dark</button>
      <button className="px-3 py-1 rounded bg-pink-200 text-pink-900">Pastel</button>
      <button className="px-3 py-1 rounded bg-gray-800 text-orange-400">Grunge</button>
      <button className="px-3 py-1 rounded bg-violet-200 text-violet-900">Sadcore</button>
    </div>
  );
}