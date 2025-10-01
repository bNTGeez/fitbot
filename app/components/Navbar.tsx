import { auth0 } from "@/lib/auth0";
import Link from "next/link";
import { User } from "lucide-react";

import LoginButton from "@/app/components/LoginButton";
import LogoutButton from "@/app/components/LogoutButton";

export default async function Navbar() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Navbar Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              FitBot
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium"
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/chat"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium"
                >
                  Chat
                </Link>
              )}
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  <Link href="/profile">
                    <User />
                  </Link>
                </span>
                <LogoutButton />
              </div>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
