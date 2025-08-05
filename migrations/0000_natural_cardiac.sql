CREATE TABLE "game_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"score" integer NOT NULL,
	"distance" integer NOT NULL,
	"coins_collected" integer NOT NULL,
	"character_used" text NOT NULL,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nft_ownership" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_id" text NOT NULL,
	"character_type" text NOT NULL,
	"minted_at" timestamp DEFAULT now(),
	"transaction_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 4) NOT NULL,
	"reason" text NOT NULL,
	"transaction_hash" text,
	"claimed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"claimed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"username" text,
	"created_at" timestamp DEFAULT now(),
	"total_tokens_earned" numeric(10, 4) DEFAULT '0',
	"total_tokens_claimed" numeric(10, 4) DEFAULT '0',
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nft_ownership" ADD CONSTRAINT "nft_ownership_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_claims" ADD CONSTRAINT "token_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;