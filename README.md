# KTX Wi-Fi Auto

iPhone에서 `KTX-WiFi-Secure`에 자동 연결하기 위한 configuration profile 배포 페이지입니다.

## 현재 확인된 규칙

- SSID: `KTX-WiFi-Secure`
- 사용자 이름: `wifiMM`
- 암호: 사용자 이름과 동일
- 예: 8월은 `wifi08` / `wifi08`
- 인증 방식: PEAP, EAP type 25
- 대상 기기: iPhone/iPad/iPod touch (`TargetDeviceType` = `1`)
- 월별 프로파일은 같은 `PayloadIdentifier`를 사용해 다음 달 설치 시 기존 프로파일 교체를 유도합니다.

## 사용 방법

```bash
npm run generate -- --month 8
```

생성 결과:

```text
profiles/KTX-WiFi-Secure_wifi08.mobileconfig
```

전체 월 파일을 한 번에 만들려면 다음을 실행합니다.

```bash
npm run generate:all
```

## 배포

`index.html`을 GitHub Pages, Cloudflare Pages, Netlify, Vercel 같은 정적 호스팅에 배포할 수 있습니다.

이 저장소에는 GitHub Pages용 Actions 워크플로가 포함되어 있습니다. 공개 저장소에서는 `main` 브랜치 push 시 배포를 시도합니다. 비공개 저장소에서 Pages를 지원하는 플랜을 사용 중이라면 저장소 변수 `ENABLE_GITHUB_PAGES`를 `true`로 설정하거나 수동 실행으로 배포하세요.

현재 플랜에서 비공개 저장소 Pages를 지원하지 않으면 GitHub API가 `Your current plan does not support GitHub Pages for this repository.` 오류를 반환합니다. 이 경우 저장소를 공개로 전환하거나, 같은 파일을 Cloudflare Pages/Netlify/Vercel 같은 정적 호스팅에 배포하세요.

중요한 점은 `.mobileconfig` 파일의 HTTP 응답 헤더가 다음 MIME 타입이어야 iPhone Safari에서 설치 프로파일로 인식된다는 것입니다.

```text
Content-Type: application/x-apple-aspen-config
```

GitHub Pages는 저장소별 MIME 타입 설정을 지원하지 않고, 현재 `.mobileconfig`를 `application/octet-stream`으로 제공할 수 있습니다. 이 저장소의 설치 페이지는 Service Worker를 등록한 뒤 페이지 안의 프로파일 링크를 `application/x-apple-aspen-config` 응답으로 감싸서 제공합니다. iPhone에서는 반드시 `index.html` 페이지에서 설치 버튼을 누르세요.

서버가 직접 올바른 MIME 타입을 제공하는지 확인하려면 다음처럼 검사하세요.

```bash
npm run check:mime -- https://wildcong.github.io/ktxwifiauto/profiles/KTX-WiFi-Secure_wifi08.mobileconfig
```

GitHub Pages에서 위 검사가 실패해도 설치 페이지 안의 버튼은 Service Worker 경유로 MIME 타입을 보정합니다. 가장 확실한 서버 레벨 해결이 필요하면 `_headers`를 지원하는 Cloudflare Pages/Netlify 또는 `vercel.json`을 지원하는 Vercel에 같은 정적 파일을 배포하세요. 이 저장소에는 두 방식의 헤더 설정 파일을 함께 포함했습니다.

## 보안 메모

`.mobileconfig` 안의 `UserPassword`는 암호화되어 있지 않은 XML 문자열입니다. 공개 저장소에 월별 프로파일을 올리면 Wi-Fi 사용자 이름과 암호가 그대로 공개됩니다.

이 저장소의 현재 규칙은 월만 알면 누구나 추측 가능한 값이므로 편의상 생성 파일을 배포할 수 있습니다. 하지만 실제로 비공개 계정이나 개인 암호를 넣어야 한다면 다음 구조가 더 안전합니다.

- 공개 저장소에는 `scripts/generate-profile.mjs`와 정적 페이지 템플릿만 둡니다.
- 실제 `.mobileconfig`는 비공개 빌드 환경에서 생성합니다.
- 배포 대상 호스팅에는 생성된 파일만 업로드하고, 소스 저장소에는 커밋하지 않습니다.
- 가능하면 AnyLink Root CA 인증서를 확보해 프로파일에 신뢰할 CA와 서버 이름을 고정합니다.

인증서 고정을 하지 않은 프로파일은 사용자가 접속 시 표시되는 서버 인증서를 직접 확인해야 합니다.

## Apple Watch 선택 화면 줄이기

iPhone에 Apple Watch가 페어링되어 있으면 프로파일 설치 시 설치 대상을 묻는 화면이 나타날 수 있습니다. 이 프로파일은 Apple의 `TargetDeviceType` 최상위 키를 `1`로 설정해 iPhone/iPad/iPod touch용 프로파일임을 명시합니다.

## 월별 갱신

매월 새 프로파일을 설치하면 같은 식별자의 기존 KTX Wi-Fi 프로파일을 교체하도록 구성했습니다. 이전 버전처럼 `wifi08` 등 월별 식별자가 들어간 프로파일을 이미 설치했다면 한 번만 직접 삭제한 뒤 새 프로파일을 설치하세요.
