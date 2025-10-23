ALTER TABLE "agents" ADD COLUMN "originalAgentId" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;