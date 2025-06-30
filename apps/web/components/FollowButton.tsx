export default function FollowButton({ isFollowing }: { isFollowing?: boolean }) {
  return (
    <button className={`px-4 py-2 rounded-full font-semibold shadow ${isFollowing ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : 'bg-green-500 text-white'}`}>
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}