export default function AuthLayout({ title, subtitle, children, right }) {
  return (
    <div className="min-h-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-700 flex flex-col items-stretch justify-start md:items-center md:justify-center p-4 md:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-lg md:min-h-[70vh]">
        {/* Left: Form */}
        <div className="bg-white/25 backdrop-blur-md p-6 md:p-10 text-white order-1 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">{title}</h1>
          {subtitle && <p className="text-white/90 mb-6 drop-shadow">{subtitle}</p>}
          <div className="bg-white/40 rounded-xl p-4 md:p-6 shadow-lg max-h-[calc(100vh-240px)] md:max-h-[calc(70vh-180px)] overflow-y-auto">
            {children}
          </div>
        </div>


        <div className="flex bg-white/10 backdrop-blur-md items-center justify-center p-8 order-2">
          <div className="max-w-md text-white/90 space-y-4">
            {right || (
              <>
                <h2 className="text-2xl font-semibold">Welcome to The Caravan Chronicle</h2>
                <p>
                  Track, resolve, and celebrate fixes across our moving city. Transparency, speed,
                  and accountability—wherever the caravan goes.
                </p>
                <div className="space-y-3">
                  <blockquote className="bg-white/15 p-4 rounded-lg">“Filing a complaint takes seconds. Seeing it resolved is even faster.”</blockquote>
                  <blockquote className="bg-white/15 p-4 rounded-lg">“Our crew dashboard keeps the whole team aligned and responsive.”</blockquote>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
