-- AlterTable
ALTER TABLE "public"."Player" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "consent" SET DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'active';
