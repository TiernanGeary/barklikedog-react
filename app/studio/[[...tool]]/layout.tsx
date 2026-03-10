export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #sidebar, #footer { display: none !important; }
        #main-content {
          margin-left: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
        }
        body { margin: 0; padding: 0; overflow: hidden; }
      `}</style>
      {children}
    </>
  )
}
