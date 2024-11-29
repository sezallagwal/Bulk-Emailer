import { ModeToggle } from "@/components/ui/theme-toggle";
export default function Navbar() {
  return (
    <>
      <nav className="fixed top-0 w-full backdrop-blur-lg z-50">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  <a href="/" className=" px-3 py-2" aria-current="page">
                    Home
                  </a>
                  <a href="/smtp" className=" px-3 py-2">
                    SMTP
                  </a>
                  <a href="/lead" className=" px-3 py-2">
                    Leads
                  </a>
                  <a href="/settings" className=" px-3 py-2">
                    Settings
                  </a>
                  <ModeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr />
      </nav>
    </>
  );
}
