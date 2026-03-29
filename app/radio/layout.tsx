export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #site-header, #site-nav { display: none !important; }
        #main-content {
          padding: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
        }
        #footer { display: none !important; }
        .page-content {
          padding: 0 !important;
          max-width: 100% !important;
        }
      `}</style>
      {children}
    </>
  )
}
