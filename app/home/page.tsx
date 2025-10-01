export const runtime = "nodejs";

import { auth0 } from "@/lib/auth0";
import { getCurrentUser, upsertUser } from "@/lib/db";
import ChatButton from "@/app/components/ChatButton";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                <span className="text-3xl">💪</span>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                FitBot
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Your AI-powered fitness companion. Get personalized workout
                plans, nutrition advice, and health insights tailored just for
                you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl mb-3">🏋️‍♂️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Personalized Workouts
                </h3>
                <p className="text-gray-600 text-sm">
                  Custom exercise routines based on your goals and fitness level
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl mb-3">🥗</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nutrition Guidance
                </h3>
                <p className="text-gray-600 text-sm">
                  Smart meal planning and dietary recommendations
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Progress Tracking
                </h3>
                <p className="text-gray-600 text-sm">
                  Monitor your fitness journey with detailed analytics
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Transform Your Health?
              </h2>
              <p className="text-gray-600 mb-6">
                Join thousands of users who are already achieving their fitness
                goals
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/api/auth/login"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Started Free
                </a>
                <a
                  href="#features"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <span className="text-2xl">💪</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome back, {session.user.name}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to continue your fitness journey?
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Start New Chat
              </h2>
              <p className="text-gray-600 mb-6">
                Begin a new conversation with your AI fitness coach. Get
                personalized advice, workout plans, and nutrition tips.
              </p>
              <ChatButton />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Choose FitBot?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI-Powered
                </h3>
                <p className="text-gray-600 text-sm">
                  Advanced AI technology provides personalized recommendations
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Instant Responses
                </h3>
                <p className="text-gray-600 text-sm">
                  Get immediate answers to your fitness questions
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Goal-Oriented
                </h3>
                <p className="text-gray-600 text-sm">
                  Tailored advice based on your specific fitness objectives
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
