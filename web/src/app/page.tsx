import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { CatchStory } from "@/components/sections/CatchStory";
import { MutationLab } from "@/components/sections/MutationLab";
import { Comparison } from "@/components/sections/Comparison";
import { Proof } from "@/components/sections/Proof";
import { OnArc } from "@/components/sections/OnArc";
import { PlugsIn } from "@/components/sections/PlugsIn";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <CatchStory />
      <MutationLab />
      <Comparison />
      <Proof />
      <OnArc />
      <PlugsIn />
      <FinalCta />
      <Footer />
    </>
  );
}
