ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE "OrganizationRole" ADD VALUE IF NOT EXISTS 'student';

CREATE TYPE "AssessmentStatus" AS ENUM ('draft', 'published');

ALTER TABLE "Organization"
ADD COLUMN "schoolCode" TEXT;

ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT;

CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT,
    "subject" TEXT,
    "joinCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassroomTeacher" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomTeacher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassroomStudent" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rollNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "chapterKey" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'draft',
    "sourcePdfUrl" TEXT,
    "videoUrl" TEXT,
    "topicIds" JSONB NOT NULL,
    "questionItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_schoolCode_key" ON "Organization"("schoolCode");
CREATE UNIQUE INDEX "Classroom_joinCode_key" ON "Classroom"("joinCode");
CREATE UNIQUE INDEX "ClassroomTeacher_classroomId_userId_key" ON "ClassroomTeacher"("classroomId", "userId");
CREATE UNIQUE INDEX "ClassroomStudent_classroomId_userId_key" ON "ClassroomStudent"("classroomId", "userId");

CREATE INDEX "Classroom_organizationId_grade_idx" ON "Classroom"("organizationId", "grade");
CREATE INDEX "Assessment_classroomId_status_createdAt_idx" ON "Assessment"("classroomId", "status", "createdAt");
CREATE INDEX "Assessment_createdByUserId_createdAt_idx" ON "Assessment"("createdByUserId", "createdAt");

ALTER TABLE "Classroom"
ADD CONSTRAINT "Classroom_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Classroom"
ADD CONSTRAINT "Classroom_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassroomTeacher"
ADD CONSTRAINT "ClassroomTeacher_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassroomTeacher"
ADD CONSTRAINT "ClassroomTeacher_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassroomStudent"
ADD CONSTRAINT "ClassroomStudent_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassroomStudent"
ADD CONSTRAINT "ClassroomStudent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assessment"
ADD CONSTRAINT "Assessment_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assessment"
ADD CONSTRAINT "Assessment_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
