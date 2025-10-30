import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { PrescriptionProvider } from "./context/PrescriptionContext";
import PrescriptionForm from "./components/PrescriptionForm";
import Tracker from "./components/Tracker";

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && typeof (window as any).rxAlert !== 'undefined';

// Auth0 config
const domain = "dev-z3e5nxsdjlzk5mu6.us.auth0.com";
const clientId = "KBkrWaToyWqRwKSE7bq0F42BQlF8upK9";
const redirectUri = window.location.origin;

console.log(domain)
console.log(clientId)

function LoginButton() {
  const { loginWithRedirect } = useAuth0();
  return (
    <button
      onClick={() => loginWithRedirect()}
      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
    >
      Sign In / Sign Up
    </button>
  );
}

function LogoutButton() {
  const { logout } = useAuth0();
  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors hover:bg-gray-100 rounded-lg"
    >
      Sign Out
    </button>
  );
}

function UserProfile() {
  const { user, isAuthenticated } = useAuth0();
  
  if (!isAuthenticated || !user) return null;
  
  return (
    <div className="flex items-center gap-3">
      {user.picture && (
        <img 
          src={user.picture} 
          alt={user.name} 
          className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-md"
        />
      )}
      <div className="text-sm hidden md:block">
        <p className="font-semibold text-gray-800">{user.name}</p>
        <p className="text-gray-500 text-xs">{user.email}</p>
      </div>
      <LogoutButton />
    </div>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <div className="text-7xl mb-6 animate-pulse">💊</div>
            <h1 className="text-6xl font-bold text-gradient mb-3">
              RxAlert
            </h1>
            <p className="text-2xl text-gray-700 mb-2 font-medium">Your Personal Prescription Tracker</p>
            <p className="text-base text-gray-500">Never run out of medication again</p>
          </div>
          
          <div className="bg-white p-10 rounded-2xl shadow-2xl mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Track your prescriptions, get low supply alerts, and manage your medications with ease.
            </p>
            <LoginButton />
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-3">🔔</div>
              <p className="font-semibold text-gray-800 text-lg">Smart Alerts</p>
              <p className="text-sm text-gray-500 mt-2">Get notified when supplies run low</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-3">📊</div>
              <p className="font-semibold text-gray-800 text-lg">Track Usage</p>
              <p className="text-sm text-gray-500 mt-2">Monitor your medication intake</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-3">🔒</div>
              <p className="font-semibold text-gray-800 text-lg">Secure</p>
              <p className="text-sm text-gray-500 mt-2">Your data is private and protected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PrescriptionProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-5xl">💊</div>
                <div>
                  <h1 className="text-4xl font-bold text-gradient">
                    RxAlert
                  </h1>
                  <p className="text-xs text-gray-500">
                    Web Application
                  </p>
                </div>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add Prescription Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">➕</span>
                <h2 className="text-3xl font-bold text-gray-800">Add Prescription</h2>
              </div>
              <PrescriptionForm />
            </div>

            {/* Tracker Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📋</span>
                <h2 className="text-3xl font-bold text-gray-800">My Prescriptions</h2>
              </div>
              <Tracker />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center text-sm text-gray-500">
          <p>© 2024 RxAlert. All rights reserved.</p>
          <p className="mt-1">Always consult your physician before making medication changes.</p>
        </footer>
      </div>
    </PrescriptionProvider>
  );
}

export default function App() {
  // Electron version: No Auth0, just use local storage
  if (isElectron) {
    return (
      <PrescriptionProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-3">
                <div className="text-5xl">💊</div>
                <div>
                  <h1 className="text-4xl font-bold text-gradient">
                    RxAlert
                  </h1>
                  <p className="text-xs text-gray-500">Desktop Application</p>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">➕</span>
                  <h2 className="text-3xl font-bold text-gray-800">Add Prescription</h2>
                </div>
                <PrescriptionForm />
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">📋</span>
                  <h2 className="text-3xl font-bold text-gray-800">My Prescriptions</h2>
                </div>
                <Tracker />
              </div>
            </div>
          </main>

          <footer className="mt-16 pb-8 text-center text-sm text-gray-500">
            <p>© 2024 RxAlert. All rights reserved.</p>
          </footer>
        </div>
      </PrescriptionProvider>
    );
  }

  // Web version: Use Auth0
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri
      }}
    >
      <AppContent />
    </Auth0Provider>
  );
}