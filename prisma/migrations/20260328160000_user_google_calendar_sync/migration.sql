-- AlterTable
ALTER TABLE "users" ADD COLUMN "google_calendar_refresh_token" TEXT;

-- CreateTable
CREATE TABLE "google_calendar_synced_blocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "merged_starts_at" TIMESTAMP(3) NOT NULL,
    "google_event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_synced_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gcal_sync_block_unique" ON "google_calendar_synced_blocks"("user_id", "booking_request_id", "merged_starts_at");

-- CreateIndex
CREATE INDEX "google_calendar_synced_blocks_user_id_idx" ON "google_calendar_synced_blocks"("user_id");

-- AddForeignKey
ALTER TABLE "google_calendar_synced_blocks" ADD CONSTRAINT "google_calendar_synced_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
