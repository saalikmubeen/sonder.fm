export function getThemeClasses(theme: string) {
  switch (theme) {
    case 'dark':
      return 'bg-gray-900 text-white';
    case 'pastel':
      return 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 text-gray-800';
    case 'grunge':
      return 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-gray-100';
    case 'sadcore':
      return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-gray-100';
    default:
      return 'bg-white text-gray-900';
  }
}