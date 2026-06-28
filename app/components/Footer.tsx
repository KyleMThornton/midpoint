export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '16px',
      fontSize: 13,
      color: '#9a8c7e',
      borderTop: '1px solid #efe7dd',
      background: 'oklch(0.985 0.012 78)',
    }}>
      Made with ♥ by{' '}
      <a
        href="https://www.kylethornton.dev"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
      >
        Kyle Thornton
      </a>
    </footer>
  );
}
