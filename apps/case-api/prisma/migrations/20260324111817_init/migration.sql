-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "submissionId" TEXT,
    "formData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "currentStepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_steps" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL DEFAULT 'unknown',
    "actor" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_documents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentTypeCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cases_serviceId_idx" ON "cases"("serviceId");

-- CreateIndex
CREATE INDEX "cases_applicantId_idx" ON "cases"("applicantId");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "case_steps_caseId_idx" ON "case_steps"("caseId");

-- CreateIndex
CREATE INDEX "case_documents_caseId_idx" ON "case_documents"("caseId");

-- AddForeignKey
ALTER TABLE "case_steps" ADD CONSTRAINT "case_steps_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
