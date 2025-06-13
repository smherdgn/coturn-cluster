// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">Aradığınız sayfa bulunamadı.</p>
      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
      >
        Ana sayfaya dön
      </a>
    </div>
  );
}
