-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARIES', 'RENT', 'DELIVERY_FUEL', 'PACKAGING', 'MARKETING', 'UTILITIES', 'MAINTENANCE', 'PROFESSIONAL_FEES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'ACCRUED', 'PAID', 'VOID');

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "unit_cost" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "payee" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "payment_ref" TEXT,
    "paid_at" TIMESTAMP(3),
    "receipt_path" TEXT,
    "notes" TEXT,
    "void_reason" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_budgets" (
    "id" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "cap" DECIMAL(12,2) NOT NULL,
    "updated_by_id" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_goals" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "target" DECIMAL(14,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "deadline" DATE NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "result_value" DECIMAL(14,2),
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_number_key" ON "expenses"("number");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_status_category_idx" ON "expenses"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "expense_budgets_month_category_key" ON "expense_budgets"("month", "category");

-- CreateIndex
CREATE UNIQUE INDEX "business_goals_number_key" ON "business_goals"("number");

-- CreateIndex
CREATE INDEX "business_goals_status_deadline_idx" ON "business_goals"("status", "deadline");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_goals" ADD CONSTRAINT "business_goals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
