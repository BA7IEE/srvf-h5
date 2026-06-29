# SRVF H5

SRVF 招新 H5 第一版，只包含新人报名与进度查询，不包含队员端、活动端或后台管理功能。

## Stack

- Vite
- Vue 3
- TypeScript
- Vant 4
- Pinia
- Vue Router
- Axios

## Pages

- `/` 招新首页
- `/recruit/apply` 报名表
- `/recruit/id-card` 身份证上传
- `/recruit/confirm` OCR 结果确认
- `/recruit/progress` 进度查询
- `/recruit/result` 提交结果

## Development

```bash
pnpm install
pnpm dev
```

The app expects the backend API to be available locally. Set `VITE_API_BASE_URL` when the API is not served from the same origin.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
node scripts/check-mobile.mjs
```
