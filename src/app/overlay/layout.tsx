export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          overflow: hidden;
        }
      `}</style>
      <div style={{ background: "transparent", margin: 0, padding: 0 }}>
        {children}
      </div>
    </>
  );
}
