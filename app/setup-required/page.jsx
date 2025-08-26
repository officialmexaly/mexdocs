export default function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Setup Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Supabase environment variables are not configured
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6 text-left">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Create a .env.local file with:
            </h2>
            <pre className="text-sm bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key`}
            </pre>
          </div>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>1. Create a Supabase project at <a href="https://supabase.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a></p>
            <p>2. Copy your project URL and anon key from the API settings</p>
            <p>3. Create a .env.local file in your project root</p>
            <p>4. Restart your development server</p>
          </div>
        </div>
      </div>
    </div>
  );
}
