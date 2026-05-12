'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { Footer } from "./chrome";

export function ChromeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
