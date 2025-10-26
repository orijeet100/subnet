ALTER TABLE "agents" ALTER COLUMN "profilePhoto" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "profilePhoto" SET DEFAULT 'null_profile.jpg';