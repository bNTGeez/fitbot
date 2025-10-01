export const runtime = "nodejs";

import { checkUserWithDb } from "@/lib/checkUser";

export default async function Profile() {
  const userData = await checkUserWithDb();

  if (!userData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">Profile</h1>
          <p className="text-gray-600 mb-6">
            You need to log in to view your profile.
          </p>
          <a
            href="/api/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Login to Continue
          </a>
        </div>
      </main>
    );
  }

  const { authUser } = userData;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Your Profile</h1>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              User Info
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Name</div>
                <div className="text-gray-900">{authUser.name || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500">Email</div>
                <div className="text-gray-900">{authUser.email || "—"}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
