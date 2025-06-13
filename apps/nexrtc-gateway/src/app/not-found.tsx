export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1>404</h1>
          <p>Sayfa bulunamadı</p>
          <a href="/">Ana Sayfaya Dön</a>
        </div>
      </body>
    </html>
  );
}
