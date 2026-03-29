-- Each 30-minute studio slot is exclusive: one booking consumes the cell.
UPDATE "booking_slots"
SET "capacity_total" = 1
WHERE "venue_kind" = 'studio_room'
  AND "capacity_total" > 1;

-- Align existing user bookings with automatic confirmation (no organiser review step).
UPDATE "booking_allocations" AS ba
SET "status" = 'approved'
FROM "booking_requests" AS br
WHERE ba."booking_request_id" = br."id"
  AND br."status" = 'pending'
  AND ba."status" = 'pending';

UPDATE "booking_requests"
SET "status" = 'approved'
WHERE "status" = 'pending';
