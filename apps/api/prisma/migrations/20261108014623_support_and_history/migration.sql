-- CreateEnum
CREATE TYPE "ThreadKind" AS ENUM ('ORDER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'RESOLVED');

-- CreateEnum
CREATE TYPE "HelpTopic" AS ENUM ('ACCOUNT', 'SHOPPING', 'PRODUCTS', 'PAYMENTS', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageAuthor" AS ENUM ('CUSTOMER', 'STAFF', 'SYSTEM');

-- CreateTable
CREATE TABLE "support_threads" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "kind" "ThreadKind" NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_id" UUID,
    "subject" TEXT NOT NULL,
    "topic" "HelpTopic",
    "status" "ThreadStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to_id" UUID,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_read_at" TIMESTAMP(3),
    "staff_read_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "author_id" UUID,
    "author" "MessageAuthor" NOT NULL,
    "body" TEXT NOT NULL,
    "event" TEXT,
    "attachment_path" TEXT,
    "attachment_name" TEXT,
    "attachment_type" TEXT,
    "attachment_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_threads_number_key" ON "support_threads"("number");

-- CreateIndex
CREATE UNIQUE INDEX "support_threads_order_id_key" ON "support_threads"("order_id");

-- CreateIndex
CREATE INDEX "support_threads_customer_id_kind_last_message_at_idx" ON "support_threads"("customer_id", "kind", "last_message_at");

-- CreateIndex
CREATE INDEX "support_threads_kind_status_last_message_at_idx" ON "support_threads"("kind", "status", "last_message_at");

-- CreateIndex
CREATE INDEX "support_messages_thread_id_created_at_idx" ON "support_messages"("thread_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "support_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
