-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'DISMISSED', 'APPEALED', 'APPEAL_UPHELD', 'APPEAL_REJECTED');

-- CreateTable
CREATE TABLE "demerit_rules" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "changed_by_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMP(3),

    CONSTRAINT "demerit_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverer_violations" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "deliverer_id" UUID NOT NULL,
    "order_id" UUID,
    "rule_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "status" "ViolationStatus" NOT NULL DEFAULT 'PROPOSED',
    "details" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reported_by_id" UUID NOT NULL,
    "decided_by_id" UUID,
    "decision_note" TEXT,
    "decided_at" TIMESTAMP(3),
    "appeal_note" TEXT,
    "appealed_at" TIMESTAMP(3),
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverer_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_actions" (
    "id" UUID NOT NULL,
    "violation_id" UUID NOT NULL,
    "status" "ViolationStatus" NOT NULL,
    "note" TEXT,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demerit_rules_code_retired_at_idx" ON "demerit_rules"("code", "retired_at");

-- CreateIndex
CREATE UNIQUE INDEX "demerit_rules_code_version_key" ON "demerit_rules"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "deliverer_violations_number_key" ON "deliverer_violations"("number");

-- CreateIndex
CREATE INDEX "deliverer_violations_deliverer_id_status_idx" ON "deliverer_violations"("deliverer_id", "status");

-- CreateIndex
CREATE INDEX "deliverer_violations_status_created_at_idx" ON "deliverer_violations"("status", "created_at");

-- CreateIndex
CREATE INDEX "violation_actions_violation_id_created_at_idx" ON "violation_actions"("violation_id", "created_at");

-- AddForeignKey
ALTER TABLE "demerit_rules" ADD CONSTRAINT "demerit_rules_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverer_violations" ADD CONSTRAINT "deliverer_violations_deliverer_id_fkey" FOREIGN KEY ("deliverer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverer_violations" ADD CONSTRAINT "deliverer_violations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverer_violations" ADD CONSTRAINT "deliverer_violations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "demerit_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverer_violations" ADD CONSTRAINT "deliverer_violations_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverer_violations" ADD CONSTRAINT "deliverer_violations_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_actions" ADD CONSTRAINT "violation_actions_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "deliverer_violations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_actions" ADD CONSTRAINT "violation_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
