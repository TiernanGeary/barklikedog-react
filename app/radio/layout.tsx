export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #sidebar { display: none !important; }
        #main-content {
          margin-left: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
        }
        #footer {
          margin-left: 0 !important;
        }
        .page-content {
          padding: 0 !important;
          max-width: 100% !important;
        }
      `}</style>
      {children}
    </>
  )
}
