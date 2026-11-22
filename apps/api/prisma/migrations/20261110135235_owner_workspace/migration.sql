/*
  Warnings:

  - A unique constraint covering the columns `[employee_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StockMovementKind" AS ENUM ('RECEIVED', 'DISPATCHED', 'COUNT_ADJUSTMENT', 'CORRECTION', 'MARKED_DAMAGED', 'WRITTEN_OFF', 'QUARANTINED', 'RELEASED_FROM_QUARANTINE', 'RETURN_RESTOCKED');

-- CreateEnum
CREATE TYPE "StockCountStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CORRECTION_REQUESTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('UNPUBLISHED', 'SCHEDULED', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ContentLanguage" AS ENUM ('EN', 'SI');

-- CreateEnum
CREATE TYPE "ExceptionArea" AS ENUM ('STOCK', 'FINANCE', 'ORDERS', 'SERVICE');

-- CreateEnum
CREATE TYPE "ExceptionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'OWNER_DECISION_REQUIRED', 'INFO_REQUESTED', 'SENT_TO_DEPARTMENT', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ClosingStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "GoalScope" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'NOT_COMPLETED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "customer_visible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "moq" INTEGER,
ADD COLUMN     "order_increment" INTEGER;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "moq_override" INTEGER;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "customer_visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employee_code" TEXT,
ADD COLUMN     "suspended_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_levels" (
    "variant_id" UUID NOT NULL,
    "physical_qty" INTEGER NOT NULL DEFAULT 0,
    "damaged_qty" INTEGER NOT NULL DEFAULT 0,
    "quarantined_qty" INTEGER NOT NULL DEFAULT 0,
    "low_stock_at" INTEGER,
    "location_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "kind" "StockMovementKind" NOT NULL,
    "physical_delta" INTEGER NOT NULL DEFAULT 0,
    "damaged_delta" INTEGER NOT NULL DEFAULT 0,
    "quarantined_delta" INTEGER NOT NULL DEFAULT 0,
    "order_id" UUID,
    "stock_count_id" UUID,
    "exception_id" UUID,
    "reason" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_counts" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "StockCountStatus" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "revises_id" UUID,
    "submitted_by_id" UUID NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_by_id" UUID,
    "decided_at" TIMESTAMP(3),
    "decision_note" TEXT,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_count_lines" (
    "id" UUID NOT NULL,
    "count_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "system_qty" INTEGER NOT NULL,
    "counted_qty" INTEGER NOT NULL,
    "reason" TEXT,
    "evidence_path" TEXT,

    CONSTRAINT "stock_count_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "created_by_id" UUID NOT NULL,
    "publication" "PublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "live_version_id" UUID,
    "publish_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "published_by_id" UUID,
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_versions" (
    "id" UUID NOT NULL,
    "banner_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "description" TEXT,
    "image_path" TEXT,
    "mobile_image_path" TEXT,
    "link_url" TEXT NOT NULL,
    "display_from" TIMESTAMP(3),
    "display_to" TIMESTAMP(3),
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by_id" UUID,
    "submitted_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_articles" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "topic" "HelpTopic",
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_article_versions" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "language" "ContentLanguage" NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by_id" UUID,
    "submitted_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_article_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_articles_live" (
    "article_id" UUID NOT NULL,
    "language" "ContentLanguage" NOT NULL,
    "version_id" UUID NOT NULL,
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_articles_live_pkey" PRIMARY KEY ("article_id","language")
);

-- CreateTable
CREATE TABLE "business_exceptions" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "area" "ExceptionArea" NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "ExceptionSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "details" TEXT,
    "department" "RoleCode" NOT NULL,
    "variant_id" UUID,
    "order_id" UUID,
    "expected_qty" INTEGER,
    "actual_qty" INTEGER,
    "expected_amount" DECIMAL(12,2),
    "actual_amount" DECIMAL(12,2),
    "proposed_physical_delta" INTEGER,
    "evidence_paths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "raised_by_id" UUID,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exception_actions" (
    "id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exception_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_closings" (
    "id" UUID NOT NULL,
    "business_date" DATE NOT NULL,
    "status" "ClosingStatus" NOT NULL DEFAULT 'DRAFT',
    "orders_placed" INTEGER NOT NULL DEFAULT 0,
    "sales_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "online_paid_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cod_collected_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unpaid_count" INTEGER NOT NULL DEFAULT 0,
    "unpaid_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refunds_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cash_difference" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bank_difference" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "prepared_by_id" UUID NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "owner_reviewed_by_id" UUID,
    "owner_reviewed_at" TIMESTAMP(3),
    "owner_review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "GoalScope" NOT NULL,
    "assignee_id" UUID,
    "role" "RoleCode" NOT NULL,
    "metric" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "review_period" TEXT,
    "instructions" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "result_value" INTEGER,
    "closed_at" TIMESTAMP(3),
    "feedback" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_revisions" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "old_values" JSONB NOT NULL,
    "new_values" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_code_key" ON "stock_locations"("code");

-- CreateIndex
CREATE INDEX "inventory_levels_location_id_idx" ON "inventory_levels"("location_id");

-- CreateIndex
CREATE INDEX "stock_movements_variant_id_created_at_idx" ON "stock_movements"("variant_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_counts_number_key" ON "stock_counts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "stock_counts_revises_id_key" ON "stock_counts"("revises_id");

-- CreateIndex
CREATE INDEX "stock_counts_status_submitted_at_idx" ON "stock_counts"("status", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_count_lines_count_id_variant_id_key" ON "stock_count_lines"("count_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "banners_number_key" ON "banners"("number");

-- CreateIndex
CREATE UNIQUE INDEX "banners_live_version_id_key" ON "banners"("live_version_id");

-- CreateIndex
CREATE INDEX "banners_publication_idx" ON "banners"("publication");

-- CreateIndex
CREATE INDEX "banner_versions_review_status_submitted_at_idx" ON "banner_versions"("review_status", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "banner_versions_banner_id_version_key" ON "banner_versions"("banner_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "help_articles_number_key" ON "help_articles"("number");

-- CreateIndex
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");

-- CreateIndex
CREATE INDEX "help_article_versions_review_status_submitted_at_idx" ON "help_article_versions"("review_status", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "help_article_versions_article_id_language_version_key" ON "help_article_versions"("article_id", "language", "version");

-- CreateIndex
CREATE UNIQUE INDEX "help_articles_live_version_id_key" ON "help_articles_live"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_exceptions_number_key" ON "business_exceptions"("number");

-- CreateIndex
CREATE INDEX "business_exceptions_status_area_idx" ON "business_exceptions"("status", "area");

-- CreateIndex
CREATE INDEX "business_exceptions_detected_at_idx" ON "business_exceptions"("detected_at");

-- CreateIndex
CREATE INDEX "exception_actions_exception_id_created_at_idx" ON "exception_actions"("exception_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "financial_closings_business_date_key" ON "financial_closings"("business_date");

-- CreateIndex
CREATE UNIQUE INDEX "goals_number_key" ON "goals"("number");

-- CreateIndex
CREATE INDEX "goals_status_deadline_idx" ON "goals"("status", "deadline");

-- CreateIndex
CREATE INDEX "goals_assignee_id_idx" ON "goals"("assignee_id");

-- CreateIndex
CREATE INDEX "goals_role_idx" ON "goals"("role");

-- CreateIndex
CREATE INDEX "goal_revisions_goal_id_created_at_idx" ON "goal_revisions"("goal_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_code_key" ON "users"("employee_code");

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_count_id_fkey" FOREIGN KEY ("stock_count_id") REFERENCES "stock_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "business_exceptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_revises_id_fkey" FOREIGN KEY ("revises_id") REFERENCES "stock_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_count_id_fkey" FOREIGN KEY ("count_id") REFERENCES "stock_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_live_version_id_fkey" FOREIGN KEY ("live_version_id") REFERENCES "banner_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_versions" ADD CONSTRAINT "banner_versions_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_versions" ADD CONSTRAINT "banner_versions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_versions" ADD CONSTRAINT "banner_versions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_article_versions" ADD CONSTRAINT "help_article_versions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "help_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_article_versions" ADD CONSTRAINT "help_article_versions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_article_versions" ADD CONSTRAINT "help_article_versions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles_live" ADD CONSTRAINT "help_articles_live_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "help_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles_live" ADD CONSTRAINT "help_articles_live_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "help_article_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles_live" ADD CONSTRAINT "help_articles_live_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_exceptions" ADD CONSTRAINT "business_exceptions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_exceptions" ADD CONSTRAINT "business_exceptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_exceptions" ADD CONSTRAINT "business_exceptions_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_actions" ADD CONSTRAINT "exception_actions_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "business_exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_actions" ADD CONSTRAINT "exception_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_closings" ADD CONSTRAINT "financial_closings_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_closings" ADD CONSTRAINT "financial_closings_owner_reviewed_by_id_fkey" FOREIGN KEY ("owner_reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_revisions" ADD CONSTRAINT "goal_revisions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_revisions" ADD CONSTRAINT "goal_revisions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
