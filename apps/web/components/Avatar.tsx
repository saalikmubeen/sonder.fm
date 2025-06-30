export default function Avatar({ src, name }: { src?: string; name?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : null}
      </div>
      <span className="text-lg font-semibold text-gray-900 dark:text-white">{name || "User"}</span>
    </div>
  );
}