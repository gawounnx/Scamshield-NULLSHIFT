"use client";

import { useState, type FormEvent } from "react";
import { AGE_LABEL, RELATION_LABEL } from "@/lib/copy";
import { guardianRequired, type AgeGroup, type Profile, type Relation } from "@/lib/profile";
import { Screen, buttonStyles } from "./ui";

const AGE_GROUPS: AgeGroup[] = ["MINOR", "ADULT", "SENIOR"];
const RELATIONS: Relation[] = ["PARENT", "CHILD", "OTHER"];
const DEFAULT_RELATION: Record<AgeGroup, Relation> = { MINOR: "PARENT", ADULT: "OTHER", SENIOR: "CHILD" };

const GUARDIAN_INTRO: Record<AgeGroup, { title: string; body: string }> = {
  MINOR: {
    title: "보호자를 지정해 주세요",
    body: "19세 미만은 보호자를 꼭 지정해야 해요. 위험한 메시지를 받으면 보호자에게 바로 알릴 수 있어요.",
  },
  SENIOR: {
    title: "자녀를 보호자로 지정해 두세요",
    body: "위험한 메시지를 받았을 때 혼자 판단하지 않고, 버튼 하나로 보호자에게 알릴 수 있어요.",
  },
  ADULT: {
    title: "보호자를 지정할 수 있어요",
    body: "위험한 메시지를 받았을 때 알릴 사람을 정해 둘 수 있어요. 건너뛰어도 돼요.",
  },
};

const digits = (phone: string) => phone.replace(/\D/g, "");

interface Props {
  initial: Profile | null;
  onDone: (profile: Profile) => void;
  onCancel?: () => void;
}

export default function Onboarding({ initial, onDone, onCancel }: Props) {
  const [step, setStep] = useState<"age" | "guardian">("age");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(initial?.ageGroup ?? null);
  const [name, setName] = useState(initial?.guardian?.name ?? "");
  const [phone, setPhone] = useState(initial?.guardian?.phone ?? "");
  const [relation, setRelation] = useState<Relation | null>(initial?.guardian?.relation ?? null);

  const chooseAge = (age: AgeGroup) => {
    setAgeGroup(age);
    if (!relation) setRelation(DEFAULT_RELATION[age]);
    setStep("guardian");
    window.scrollTo(0, 0);
  };

  if (step === "age" || !ageGroup) {
    return (
      <Screen>
        <p className="text-base font-medium text-ink-soft">1/2</p>
        <h1 className="mt-2 font-display text-[34px] leading-tight">나이를 알려 주세요</h1>
        <p className="mt-3 text-ink-soft">나이에 맞게 보호자 연결을 안내해 드려요. 생년월일은 묻지 않아요.</p>
        <div className="mt-8 flex flex-col gap-3">
          {AGE_GROUPS.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => chooseAge(age)}
              aria-pressed={ageGroup === age}
              className={`flex min-h-20 items-center rounded-2xl border-2 px-6 text-left text-[24px] font-bold transition-colors ${
                ageGroup === age ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink"
              }`}
            >
              {AGE_LABEL[age]}
            </button>
          ))}
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${buttonStyles.quiet} mt-6`}>
            바꾸지 않고 돌아가기
          </button>
        )}
      </Screen>
    );
  }

  const required = guardianRequired(ageGroup);
  const intro = GUARDIAN_INTRO[ageGroup];
  const filled = name.trim() !== "" && digits(phone).length >= 9 && relation !== null;
  const partlyFilled = name.trim() !== "" || phone.trim() !== "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!filled || !relation) return;
    onDone({ ageGroup, guardian: { name: name.trim(), phone: digits(phone), relation } });
  };

  return (
    <Screen>
      <div className="flex items-center justify-between text-base font-medium text-ink-soft">
        <p>2/2</p>
        <button type="button" onClick={() => setStep("age")} className="min-h-11 underline underline-offset-4">
          나이 다시 고르기
        </button>
      </div>
      <h1 className="mt-2 font-display text-[34px] leading-tight">{intro.title}</h1>
      <p className="mt-3 text-ink-soft">{intro.body}</p>

      <form onSubmit={submit} className="mt-8 flex flex-1 flex-col">
        <label className="block">
          <span className="font-bold">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            placeholder="예: 큰아들"
            className="mt-2 block min-h-14 w-full rounded-xl border-2 border-line bg-surface px-4 text-[20px] placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
          />
        </label>
        <label className="mt-5 block">
          <span className="font-bold">전화번호</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="010-1234-5678"
            className="mt-2 block min-h-14 w-full rounded-xl border-2 border-line bg-surface px-4 text-[20px] tabular-nums placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
          />
        </label>
        <fieldset className="mt-5">
          <legend className="font-bold">나와의 관계</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {RELATIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRelation(r)}
                aria-pressed={relation === r}
                className={`min-h-14 rounded-xl border-2 text-[19px] font-bold ${
                  relation === r ? "border-ink bg-ink text-white" : "border-line bg-surface"
                }`}
              >
                {RELATION_LABEL[r]}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-5 text-base text-ink-soft">보호자 정보는 이 휴대폰에만 저장돼요.</p>

        <div className="mt-auto flex flex-col gap-2 pt-8">
          <button type="submit" disabled={!filled} className={buttonStyles.primary}>
            보호자 지정하고 시작하기
          </button>
          {!required && (
            <button
              type="button"
              onClick={() => onDone({ ageGroup, guardian: null })}
              className={buttonStyles.quiet}
            >
              {partlyFilled ? "보호자 없이 시작하기" : "나중에 할게요"}
            </button>
          )}
        </div>
      </form>
    </Screen>
  );
}
