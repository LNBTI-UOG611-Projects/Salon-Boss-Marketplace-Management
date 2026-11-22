-- CreateEnum
CREATE TYPE "ReturnOutcome" AS ENUM ('REPLACEMENT', 'REFUND', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "ReturnCaseStatus" AS ENUM ('OPEN', 'AWAITING_RETURN', 'RECEIVED', 'QC_VERIFIED', 'CLASSIFIED', 'CLOSED', 'NO_RETURN_REQUIRED');

-- CreateEnum
CREATE TYPE "ReturnClassification" AS ENUM ('RESTOCK', 'QUARANTINE', 'DAMAGED');

-- CreateEnum
CREATE TYPE "QcResult" AS ENUM ('IN_PROGRESS', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReceiptSource" AS ENUM ('EXTERNAL_PO', 'OWNER_HUB', 'INTERNAL_TRANSFER');

-- CreateEnum
CREATE TYPE "WarehouseRecordStatus" AS ENUM ('DRAFT', 'CONFIRMED');

-- AlterEnum
ALTER TYPE "StockCountStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "stock_counts" ADD COLUMN     "location_id" UUID,
ADD COLUMN     "witness_id" UUID;

-- CreateTable
CREATE TABLE "return_cases" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "inspection_id" UUID NOT NULL,
    "status" "ReturnCaseStatus" NOT NULL DEFAULT 'OPEN',
    "requested_outcome" "ReturnOutcome" NOT NULL,
    "customer_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_outcome" "ReturnOutcome",
    "return_authorised" BOOLEAN,
    "decision_note" TEXT,
    "decided_by_id" UUID,
    "decided_at" TIMESTAMP(3),
    "received_by_id" UUID,
    "received_at" TIMESTAMP(3),
    "qc_by_id" UUID,
    "qc_at" TIMESTAMP(3),
    "qc_note" TEXT,
    "classified_by_id" UUID,
    "classified_at" TIMESTAMP(3),
    "closed_by_id" UUID,
    "closed_at" TIMESTAMP(3),
    "closing_note" TEXT,

    CONSTRAINT "return_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_case_lines" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "requested_qty" INTEGER NOT NULL,
    "verified_qty" INTEGER,
    "qc_note" TEXT,
    "qc_good_qty" INTEGER,
    "qc_damaged_qty" INTEGER,
    "qc_review_qty" INTEGER,
    "restocked_qty" INTEGER NOT NULL DEFAULT 0,
    "quarantined_qty" INTEGER NOT NULL DEFAULT 0,
    "damaged_qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "return_case_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_case_events" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "status" "ReturnCaseStatus" NOT NULL,
    "note" TEXT,
    "actor_id" UUID,
    "actor_role" "RoleCode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_case_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspections" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "result" "QcResult" NOT NULL DEFAULT 'IN_PROGRESS',
    "reinspection" BOOLEAN NOT NULL DEFAULT false,
    "inspector_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "note" TEXT,
    "sticker_ref" TEXT,

    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspection_lines" (
    "id" UUID NOT NULL,
    "inspection_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "passed_qty" INTEGER NOT NULL DEFAULT 0,
    "failed_qty" INTEGER NOT NULL DEFAULT 0,
    "label_ok" BOOLEAN,
    "quantity_ok" BOOLEAN,
    "seal_ok" BOOLEAN,
    "condition_ok" BOOLEAN,
    "expiry_ok" BOOLEAN,
    "defect_note" TEXT,
    "checked_at" TIMESTAMP(3),

    CONSTRAINT "qc_inspection_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_photos" (
    "id" UUID NOT NULL,
    "inspection_id" UUID NOT NULL,
    "line_id" UUID,
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" TEXT,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_receipts" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "source" "ReceiptSource" NOT NULL,
    "consignor" TEXT NOT NULL,
    "reference" TEXT,
    "bill_path" TEXT,
    "location_id" UUID,
    "status" "WarehouseRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "received_by_id" UUID NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_receipt_lines" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "documented_qty" INTEGER NOT NULL,
    "actual_qty" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "stock_receipt_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_collections" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "bill_ref" TEXT,
    "bill_path" TEXT,
    "status" "WarehouseRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "officer_id" UUID NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_collection_lines" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "ordered_qty" INTEGER NOT NULL,
    "picked_qty" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "order_collection_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_packings" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "cartons" INTEGER NOT NULL DEFAULT 1,
    "seal_id" TEXT,
    "note" TEXT,
    "status" "WarehouseRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "packed_by_id" UUID NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_packings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_evidence" (
    "id" UUID NOT NULL,
    "receipt_id" UUID,
    "collection_id" UUID,
    "packing_id" UUID,
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" TEXT,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_cases_number_key" ON "return_cases"("number");

-- CreateIndex
CREATE UNIQUE INDEX "return_cases_order_id_key" ON "return_cases"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "return_cases_inspection_id_key" ON "return_cases"("inspection_id");

-- CreateIndex
CREATE INDEX "return_cases_status_created_at_idx" ON "return_cases"("status", "created_at");

-- CreateIndex
CREATE INDEX "return_cases_customer_id_created_at_idx" ON "return_cases"("customer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "return_case_lines_case_id_order_item_id_key" ON "return_case_lines"("case_id", "order_item_id");

-- CreateIndex
CREATE INDEX "return_case_events_case_id_created_at_idx" ON "return_case_events"("case_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "qc_inspections_number_key" ON "qc_inspections"("number");

-- CreateIndex
CREATE INDEX "qc_inspections_order_id_started_at_idx" ON "qc_inspections"("order_id", "started_at");

-- CreateIndex
CREATE INDEX "qc_inspections_result_started_at_idx" ON "qc_inspections"("result", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "qc_inspection_lines_inspection_id_order_item_id_key" ON "qc_inspection_lines"("inspection_id", "order_item_id");

-- CreateIndex
CREATE INDEX "qc_photos_inspection_id_idx" ON "qc_photos"("inspection_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_receipts_number_key" ON "stock_receipts"("number");

-- CreateIndex
CREATE INDEX "stock_receipts_status_created_at_idx" ON "stock_receipts"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_receipt_lines_receipt_id_variant_id_key" ON "stock_receipt_lines"("receipt_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_collections_number_key" ON "order_collections"("number");

-- CreateIndex
CREATE UNIQUE INDEX "order_collections_order_id_key" ON "order_collections"("order_id");

-- CreateIndex
CREATE INDEX "order_collections_status_created_at_idx" ON "order_collections"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_collection_lines_collection_id_order_item_id_key" ON "order_collection_lines"("collection_id", "order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_packings_order_id_key" ON "order_packings"("order_id");

-- CreateIndex
CREATE INDEX "warehouse_evidence_receipt_id_idx" ON "warehouse_evidence"("receipt_id");

-- CreateIndex
CREATE INDEX "warehouse_evidence_collection_id_idx" ON "warehouse_evidence"("collection_id");

-- CreateIndex
CREATE INDEX "warehouse_evidence_packing_id_idx" ON "warehouse_evidence"("packing_id");

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "delivery_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_qc_by_id_fkey" FOREIGN KEY ("qc_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_classified_by_id_fkey" FOREIGN KEY ("classified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_cases" ADD CONSTRAINT "return_cases_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_case_lines" ADD CONSTRAINT "return_case_lines_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "return_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_case_lines" ADD CONSTRAINT "return_case_lines_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_case_events" ADD CONSTRAINT "return_case_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "return_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_case_events" ADD CONSTRAINT "return_case_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspection_lines" ADD CONSTRAINT "qc_inspection_lines_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspection_lines" ADD CONSTRAINT "qc_inspection_lines_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_photos" ADD CONSTRAINT "qc_photos_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_photos" ADD CONSTRAINT "qc_photos_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "qc_inspection_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_photos" ADD CONSTRAINT "qc_photos_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_witness_id_fkey" FOREIGN KEY ("witness_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipts" ADD CONSTRAINT "stock_receipts_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipts" ADD CONSTRAINT "stock_receipts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipt_lines" ADD CONSTRAINT "stock_receipt_lines_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "stock_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipt_lines" ADD CONSTRAINT "stock_receipt_lines_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_collections" ADD CONSTRAINT "order_collections_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_collections" ADD CONSTRAINT "order_collections_officer_id_fkey" FOREIGN KEY ("officer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_collection_lines" ADD CONSTRAINT "order_collection_lines_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "order_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_collection_lines" ADD CONSTRAINT "order_collection_lines_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_packings" ADD CONSTRAINT "order_packings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_packings" ADD CONSTRAINT "order_packings_packed_by_id_fkey" FOREIGN KEY ("packed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_evidence" ADD CONSTRAINT "warehouse_evidence_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "stock_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_evidence" ADD CONSTRAINT "warehouse_evidence_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "order_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_evidence" ADD CONSTRAINT "warehouse_evidence_packing_id_fkey" FOREIGN KEY ("packing_id") REFERENCES "order_packings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_evidence" ADD CONSTRAINT "warehouse_evidence_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
