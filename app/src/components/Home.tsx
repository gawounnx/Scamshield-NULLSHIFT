"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { SAMPLE_MESSAGES } from "@/lib/samples";
import { Icon, Screen, buttonStyles } from "./ui";

interface Props {
  onText: (text: string) => void;
  onScreenshot: (file: File) => void;
  onEditProfile: () => void;
}

export default function Home({ onText, onScreenshot, onEditProfile }: Props) {
  const [text, setText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (file) onScreenshot(file);
  };

  return (
    <Screen>
      <header className="flex items-center justify-between">
        <p className="font-display text-[22px]">ScamShield</p>
        <button type="button" onClick={onEditProfile} className="min-h-11 text-base font-medium text-ink-soft underline underline-offset-4">
          보호자 설정
        </button>
      </header>

      <h1 className="mt-10 font-display text-[40px] leading-[1.15]">
        이 메시지,
        <br />
        사기일까요?
      </h1>
      <p className="mt-4 text-ink-soft">
        받은 문자나 카톡을 보여 주면 사기인지, 왜 그런지, 지금 무엇을 하면 되는지 알려 드려요.
      </p>

      <input ref={fileInput} type="file" accept="image/*" onChange={pickFile} className="sr-only" tabIndex={-1} aria-hidden />
      <button type="button" onClick={() => fileInput.current?.click()} className={`${buttonStyles.primary} mt-8 min-h-16 text-[21px]`}>
        <Icon name="camera" className="size-7" />
        스크린샷 올리기
      </button>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (text.trim()) onText(text);
        }}
      >
        <label htmlFor="message" className="font-bold">
          또는 메시지를 붙여넣기
        </label>
        <textarea
          id="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="받은 메시지를 길게 눌러 복사한 뒤 여기에 붙여넣으세요"
          className="mt-2 block w-full resize-none rounded-xl border-2 border-line bg-surface p-4 text-[19px] leading-relaxed placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
        />
        <button type="submit" disabled={!text.trim()} className={`${buttonStyles.secondary} mt-3`}>
          이 메시지 확인하기
        </button>
      </form>

      <section className="mt-12 border-t border-line pt-6" aria-labelledby="samples">
        <h2 id="samples" className="font-bold">
          샘플로 먼저 해 보기
        </h2>
        <ul className="mt-3 flex flex-col">
          {SAMPLE_MESSAGES.map((sample) => (
            <li key={sample.id}>
              <button
                type="button"
                onClick={() => onText(sample.text)}
                className="flex w-full flex-col items-start gap-1 border-b border-line py-4 text-left"
              >
                <span className="font-bold">{sample.title}</span>
                <span className="line-clamp-1 text-base text-ink-soft">{sample.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-base text-ink-soft">원문을 저장하지 않습니다. 메시지 속 링크도 열지 않아요.</p>
    </Screen>
  );
}
