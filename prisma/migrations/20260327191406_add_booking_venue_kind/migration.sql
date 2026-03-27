-- CreateEnum
CREATE TYPE "BookingVenueKind" AS ENUM ('studio_room', 'open_space');

-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN     "venue_kind" "BookingVenueKind" NOT NULL DEFAULT 'studio_room';

-- AlterTable
ALTER TABLE "booking_slots" ADD COLUMN     "venue_kind" "BookingVenueKind" NOT NULL DEFAULT 'studio_room';

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "booking_venue_kind" "BookingVenueKind" NOT NULL DEFAULT 'studio_room';

-- CreateIndex
CREATE INDEX "booking_slots_venue_kind_starts_at_idx" ON "booking_slots"("venue_kind", "starts_at");
