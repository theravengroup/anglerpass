import CompassChat from "@/components/compass/CompassChat";

export const metadata = {
  title: "Compass | AnglerPass",
  description: "AI-powered trip planning assistant for private fly fishing.",
};

export default function CompassPage() {
  return (
    <div className="h-[calc(100vh-4rem)] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <CompassChat />
    </div>
  );
}
