import { HomeCurtain } from "@/components/home/HomeCurtain";
import { HomeContent } from "@/components/home/HomeContent";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function Home() {
  return <div className="drg-home-page"><HomeCurtain/><HomeContent/><PublicFooter/></div>;
}
