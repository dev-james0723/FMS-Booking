# D Festival × 幻樂空間 — Web 應用

Next.js（App Router）+ PostgreSQL（Prisma）+ 自管 Email／密碼（Argon2）+ JWT Session（httpOnly cookie）。

## 本機開發

1. 在上一層目錄啟動資料庫：

   ```bash
   docker compose up -d
   ```

2. 複製環境變數並安裝依賴：

   ```bash
   cp .env.example .env
   npm install
   ```

3. 執行 migration 與 seed（預設系統設定 + `super@staging.local` 管理員）：

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

4. 啟動開發伺服器：

   ```bash
   npm run dev
   ```

   瀏覽 [http://localhost:3000](http://localhost:3000)。

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm run db:studio` | Prisma Studio |
| `npm run build` | Production build |
| `npm run db:seed` | 重新寫入 seed（留意會 upsert 設定） |

## API（v1）

- `GET /api/v1/public/settings` — 公開系統設定（倒數、活動日期等）
- `POST /api/v1/registration` — 用戶登記
- `POST /api/v1/auth/login` / `logout` / `change-password`
- `GET /api/v1/me` — 目前用戶與預約 gate 狀態
- `GET /api/v1/booking/availability?from=yyyy-MM-dd&to=yyyy-MM-dd` — 可預約時段（香港曆日）
- `POST /api/v1/booking/request` — body `{ slotIds: uuid[], bonusRewardId?: uuid }`
- `GET /api/v1/booking/history` — 我的預約紀錄

預約規則（伺服器強制）：活動日期內、最多提前 N 日、個人／教學每日上限、連續 3 曆日滾動上限、名額、時段重疊、須已改密碼且 `booking_opens_at` 已過。

## 預覽網站

```bash
npm run dev
```

瀏覽 **http://localhost:3000**（前台）、**http://localhost:3000/admin/login**（後台）。

## 管理後台

- 登入：`POST /api/v1/admin/auth/login`（頁面：`/admin/login`）
- 預約列表：`/admin/bookings`（批核／後補／拒絕）
- 日曆預覽：`/admin/calendar?from=&to=`（API：`GET /api/v1/admin/calendar`）
- 拒絕時會退回 bonus 額度（如有使用 `bonusRewardId`）

時區：業務邏輯與展示以 **Asia/Hong_Kong** 為準；資料庫存 UTC。

## 管理員（seed）

- Email：`super@staging.local`
- 密碼：環境變數 `SEED_ADMIN_PASSWORD`，預設 `AdminStaging1!`

後台 UI 尚未接線；可先使用 Prisma Studio 或直接連 API（後續 Phase）。
