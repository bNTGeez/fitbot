import { auth0 } from "@/lib/auth0";
import ChatButton from "@/app/components/ChatButton";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to FitBot
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please log in to get started
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Ready to start your fitness journey?
          </p>
          <ChatButton />
        </div>
      </div>
    </main>
  );
}
