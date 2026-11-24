import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_grants_area" AS ENUM('natural-products', 'data-analytics', 'social-innovation');
  CREATE TYPE "public"."enum_grants_status" AS ENUM('pending', 'active', 'completed', 'archived');
  CREATE TYPE "public"."enum_grants_source" AS ENUM('manual', 'excel', 'dynamics365');
  CREATE TABLE "grants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"short_description" varchar,
  	"funder_id" integer NOT NULL,
  	"program" varchar,
  	"amount_cents" numeric,
  	"area" "enum_grants_area" NOT NULL,
  	"engagement_type_id" integer,
  	"faculty_lead" varchar,
  	"partner" varchar,
  	"hide_partner_on_display" boolean DEFAULT false,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"status" "enum_grants_status" DEFAULT 'pending' NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"auto_complete" boolean DEFAULT true,
  	"students_involved" numeric,
  	"outcome_highlight" varchar,
  	"cover_photo_id" integer,
  	"show_on_display" boolean DEFAULT true,
  	"source" "enum_grants_source" DEFAULT 'manual',
  	"external_id" varchar,
  	"locked_fields" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "grants_id" integer;
  ALTER TABLE "grants" ADD CONSTRAINT "grants_funder_id_funders_id_fk" FOREIGN KEY ("funder_id") REFERENCES "public"."funders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "grants" ADD CONSTRAINT "grants_engagement_type_id_engagement_types_id_fk" FOREIGN KEY ("engagement_type_id") REFERENCES "public"."engagement_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "grants" ADD CONSTRAINT "grants_cover_photo_id_media_id_fk" FOREIGN KEY ("cover_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "grants_funder_idx" ON "grants" USING btree ("funder_id");
  CREATE INDEX "grants_engagement_type_idx" ON "grants" USING btree ("engagement_type_id");
  CREATE INDEX "grants_cover_photo_idx" ON "grants" USING btree ("cover_photo_id");
  CREATE INDEX "grants_updated_at_idx" ON "grants" USING btree ("updated_at");
  CREATE INDEX "grants_created_at_idx" ON "grants" USING btree ("created_at");
  CREATE UNIQUE INDEX "source_externalId_idx" ON "grants" USING btree ("source","external_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_grants_fk" FOREIGN KEY ("grants_id") REFERENCES "public"."grants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_grants_id_idx" ON "payload_locked_documents_rels" USING btree ("grants_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "grants" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "grants" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_grants_fk";
  
  DROP INDEX "payload_locked_documents_rels_grants_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "grants_id";
  DROP TYPE "public"."enum_grants_area";
  DROP TYPE "public"."enum_grants_status";
  DROP TYPE "public"."enum_grants_source";`)
}
