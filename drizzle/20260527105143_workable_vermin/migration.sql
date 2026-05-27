CREATE TYPE "expenses_categories" AS ENUM('food_drinks', 'groceries_household', 'transportation', 'bills_utilities', 'health_wellness', 'hobbies_lifestyle', 'financial');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"description" text NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"category" "expenses_categories" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
