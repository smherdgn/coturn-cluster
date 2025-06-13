'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
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
      <h1 style={{ fontSize: '4rem', margin: '0', color: '#dc2626' }}>500</h1>
      <h2 style={{ margin: '20px 0' }}>Bir Hata Oluştu</h2>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        Üzgünüz, bir şeyler yanlış gitti.
      </p>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Tekrar Dene
        </button>
        
        <a 
          href="/"
          style={{
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px'
          }}
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
