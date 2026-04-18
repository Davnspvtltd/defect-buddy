import DefectEntryForm from "@/components/DefectEntryForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <img
              src="/Stellantis.svg.png"
              alt="Stellantis Logo"
              className="h-7 w-auto object-contain"
            />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div>
              <div className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground leading-none mb-0.5">
                Quality Operations
              </div>
              <h1 className="text-sm sm:text-base font-semibold tracking-tight leading-none">
                Universal Defect Entry
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>v1.0</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </header>

      <main className="container px-3 py-5 sm:px-6 sm:py-8 lg:py-10">
        <DefectEntryForm />
      </main>

      <footer className="border-t">
        <div className="container py-5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          7,323 historical records · Smart suggestions · Auto-codes
        </div>
      </footer>
    </div>
  );
};

export default Index;
