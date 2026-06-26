export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-light mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" fill="#1A6B3C" fillOpacity="0.15" stroke="#1A6B3C" strokeWidth="1.5" />
              <path d="M14 7L20 10.5V17.5L14 21L8 17.5V10.5L14 7Z" fill="#1A6B3C" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-2xl text-ink">Symbodied Admin</h2>
          <p className="text-sm text-ink-500 font-sans mt-1">Restricted access — authorised personnel only</p>
        </div>
        <div className="bg-white rounded-2xl shadow-[var(--shadow-md)] p-8 border border-ink-200">
          {children}
        </div>
      </div>
    </div>
  );
}
