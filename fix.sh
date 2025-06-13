# Dosyayı değiştir
cat > apps/nexrtc-gateway/src/pages/404.tsx << 'EOF'
// Ultra minimal 404 page - no external variables
export default function Custom404() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '6rem',
        margin: '0',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        404
      </h1>
      
      <h2 style={{
        fontSize: '2rem',
        margin: '20px 0',
        fontWeight: 'normal'
      }}>
        Sayfa Bulunamadı
      </h2>
      
      <p style={{
        fontSize: '1.1rem',
        marginBottom: '40px',
        opacity: 0.9,
        maxWidth: '500px'
      }}>
        Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        
          href="/"
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            border: '2px solid rgba(255,255,255,0.3)',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          🏠 Ana Sayfa
        </a>
        
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ⬅️ Geri Git
        </button>
      </div>
      
      <div style={{
        marginTop: '60px',
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>
          Popüler Sayfalar
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <a href="/dashboard" style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>📊 Dashboard</a>
          <a href="/instances" style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>🖥️ Instances</a>
          <a href="/settings" style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>⚙️ Settings</a>
          <a href="/docs" style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>📚 Docs</a>
        </div>
      </div>
      
      <p style={{
        marginTop: '40px',
        fontSize: '0.9rem',
        opacity: 0.7
      }}>
        Problem devam ederse destek ekibiyle iletişime geçin.
      </p>
    </div>
  );
}
EOF