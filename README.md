# 통합 에니어그램 검사

iEQ9 수준을 목표로 한 적응형 에니어그램 검사 웹앱입니다. 결과로 9유형, 날개, 본능 하위유형(27), 트라이타입, 센터, 통합 수준, 응답 타당도를 보여 줍니다.

**검사하기:** https://rhombusbork.github.io/tests_psychological/

- 리커트 5점 + 강제선택 4단계 혼합, 3단계 적응형 (약 320문항, 40–50분)
- 모든 계산은 브라우저에서만 수행되며, 응답은 서버로 전송되지 않습니다
- 자기이해 목적의 비공식 검사이며 임상 진단이 아닙니다

## 개발

```bash
npm install
npm run dev        # 로컬 서버
npm run validate   # 문항 은행 검증
npm test           # 단위·렌더 테스트
npm run simulate   # 가상 응답자 판정 정확도 (예: npm run simulate 100 hard)
npm run build      # 정적 빌드
```

설계 문서는 [docs/](docs/), 작업 규칙은 [CLAUDE.md](CLAUDE.md)에 있습니다.
