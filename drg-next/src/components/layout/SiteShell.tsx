import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="drg-page"><PublicHeader/><main>{children}</main><PublicFooter/></div>;
}
