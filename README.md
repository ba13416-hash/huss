# HUSS 포용사회사업단 인지도 설문

HUSS 인지도 설문용 React 앱입니다. PDF의 Q1~Q12 문항과 보기를 앱에서 그대로 제공하고, 응답은 Firestore의 학과별 경로로 저장합니다.

## 로컬 실행

```sh
npm install
cp .env.example .env.local
# Firebase Console의 웹 앱 구성 값을 .env.local에 입력합니다.
npm run dev
```

## Firebase 설정

기본 Firebase 프로젝트는 `huss-39792`입니다. Firebase Console에서 이 프로젝트에 웹 앱을 등록하고, 웹 앱 구성의 값을 Vercel 환경 변수로 등록하세요.

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Cloud Firestore를 활성화하고 이 저장소의 `firestore.rules`를 게시해야 응답을 저장하고 관리자 페이지에서 확인할 수 있습니다. 응답 읽기는 PIN과 별개로 Firebase 규칙에서 공개 허용됩니다. 이 구성은 짧은 기간의 소규모 설문용이며, 응답에 개인정보가 포함되므로 누구나 기술적으로 응답을 읽을 수 있다는 점을 이해하고 사용하세요. 별도의 Google Cloud 결제 계정이나 서비스 계정 키는 필요하지 않습니다.

관리자 화면의 전체 집계는 `departments/.../responses` 컬렉션 그룹을 읽습니다. 이를 사용하려면 갱신된 `firestore.rules`도 Firebase Console에서 게시해야 합니다. 대시보드에는 총 응답자 수, 학과별 응답자 수, Q1~Q12 문항별 선택 수가 표시됩니다. 복수응답 문항의 막대는 응답자 수 대비 선택 비율이며, 한 응답자가 여러 선택지에 포함될 수 있습니다.

## Vercel 배포

GitHub 저장소를 Vercel에 가져온 뒤 Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는 `dist`로 설정합니다. 위 Firebase 환경 변수를 Production/Preview/Development 환경에 필요한 범위로 등록합니다. `vercel.json`은 SPA 경로를 `/index.html`로 연결합니다.

## Firebase Hosting 대안

Firebase Hosting을 사용할 경우 `npm run build` 후 `npx firebase-tools deploy --only hosting,firestore:rules --project huss-39792` 명령을 사용할 수 있습니다. Vercel 배포와 함께 사용할 필요는 없습니다.

