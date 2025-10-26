const MainContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex flex-col p-4 grow min-w-0 min-h-0">
      <div className="w-full max-w-sm mx-auto flex flex-col grow min-w-0 min-h-0">
        {children}
      </div>
    </main>
  );
};

export { MainContainer };
