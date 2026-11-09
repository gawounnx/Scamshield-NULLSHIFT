// Demo sample messages (SPEC.md demo scenario, docs/API.md mock examples).

export interface SampleMessage {
  id: string;
  title: string;
  text: string;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: "parcel-smishing",
    title: "택배 주소를 고치라는 문자",
    text: "[Web발신] 고객님의 택배가 주소지 불일치로 보관 중입니다. 오늘 안에 주소를 수정하지 않으면 반송됩니다. https://cj-logistics-kr.top/a8Fk2",
  },
  {
    id: "acquaintance",
    title: "폰이 깨졌다는 자녀의 문자",
    text: "엄마 나 폰 액정 깨져서 수리 맡겼어. 이 번호로 문자만 돼. 급하게 결제할 게 있는데 엄마 카드 앞뒤 사진이랑 비밀번호 좀 보내줘. 아빠한테는 말하지 말고",
  },
  {
    id: "normal-parcel",
    title: "배송 예정 안내 문자",
    text: "[CJ대한통운] 고객님의 상품이 오늘(11/9) 14~16시 사이 배송될 예정입니다. 담당 기사: 김OO",
  },
];
