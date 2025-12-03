export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-teal-400 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
      <p className="text-slate-400 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <a
        href="/"
        className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all duration-200"
      >
        Back to Dashboard
      </a>
    </div>
  )
}
