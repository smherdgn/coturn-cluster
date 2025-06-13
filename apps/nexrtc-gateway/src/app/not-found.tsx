// pages/404.tsx
function NotFoundContent() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2">Sayfa bulunamadı.</p>
    </div>
  );
}

export default function Custom404() {
  return <NotFoundContent />;
}
