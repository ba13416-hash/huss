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

Cloud Firestore를 활성화하고 이 저장소의 `firestore.rules`를 배포해야 응답을 저장할 수 있습니다. 이 설문은 이름·성별·학과를 수집하므로 응답 데이터에 접근할 수 있는 운영자 계정을 제한하고, 배포 전에 개인정보 안내 및 보관 기간을 확인하세요.

### 관리자 응답 조회

관리자 조회는 Vercel 서버 함수에서 Firebase Admin SDK로 수행합니다. 브라우저 클라이언트에는 Firestore 읽기 권한을 주지 않습니다. Vercel Production 환경에 다음 **서버 환경 변수**를 등록하세요. `FIREBASE_SERVICE_ACCOUNT_JSON`에는 `huss-39792`의 전용 서비스 계정 JSON 전체를 넣고, 해당 계정에는 `Cloud Datastore Viewer` 역할만 부여합니다.

- `ADMIN_PIN`: 운영자가 정한 4자리 PIN
- `FIREBASE_SERVICE_ACCOUNT_JSON`: 서비스 계정 키 JSON 전체. Secret으로 저장하고 GitHub에 커밋하지 않습니다.

환경 변수 등록 후 Production을 재배포하고, Firebase Console의 Firestore 규칙에 이 저장소의 `firestore.rules`를 게시하세요. 해당 규칙은 설문 응답 생성만 공개하고 브라우저 응답 읽기는 차단합니다. 운영자 API만 서비스 계정으로 응답을 조회합니다.

## Vercel 배포

GitHub 저장소를 Vercel에 가져온 뒤 Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는 `dist`로 설정합니다. 위 Firebase 환경 변수를 Production/Preview/Development 환경에 필요한 범위로 등록합니다. `vercel.json`은 SPA 경로를 `/index.html`로 연결합니다.

## Firebase Hosting 대안

Firebase Hosting을 사용할 경우 `npm run build` 후 `npx firebase-tools deploy --only hosting,firestore:rules --project huss-39792` 명령을 사용할 수 있습니다. Vercel 배포와 함께 사용할 필요는 없습니다.
