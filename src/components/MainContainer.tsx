const MainContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="grow min-w-0 min-h-0 flex flex-col p-4 w-full">
      <div className="w-full max-w-sm mx-auto flex flex-col">{children}</div>
    </main>
  );
};

export { MainContainer };
