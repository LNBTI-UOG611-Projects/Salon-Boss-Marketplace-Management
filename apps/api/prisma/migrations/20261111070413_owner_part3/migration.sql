-- CreateTable
CREATE TABLE "integrity_checkpoints" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "digest" TEXT NOT NULL,
    "datasets" JSONB NOT NULL,
    "sample" JSONB,
    "note" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrity_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integrity_checkpoints_number_key" ON "integrity_checkpoints"("number");

-- CreateIndex
CREATE INDEX "integrity_checkpoints_created_at_idx" ON "integrity_checkpoints"("created_at");

-- AddForeignKey
ALTER TABLE "integrity_checkpoints" ADD CONSTRAINT "integrity_checkpoints_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
