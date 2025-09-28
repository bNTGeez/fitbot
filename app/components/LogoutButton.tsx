export default function LogoutButton() {
  return (
    <a
      href="/api/auth/logout"
      className="bg-blue-400 hover:bg-blue-500 text-black px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      Logout
    </a>
  );
}
