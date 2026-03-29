-- CreateEnum
CREATE TYPE "CameraRentalPaymentChoice" AS ENUM ('paid_before_booking', 'pay_after_booking');

-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN "camera_rental_opt_in" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "booking_requests" ADD COLUMN "camera_rental_payment_choice" "CameraRentalPaymentChoice";
