import { Screen, Seal } from "./ui";

export default function Analyzing() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center" role="status" aria-live="polite">
        <Seal level={null} size={132} />
        <h1 className="mt-10 font-display text-[30px]">판정하고 있어요</h1>
        <p className="mt-3 max-w-[18em] text-ink-soft">
          메시지 속 의심 신호를 찾고 있어요. 그동안 링크는 누르지 마세요.
        </p>
      </div>
    </Screen>
  );
}
