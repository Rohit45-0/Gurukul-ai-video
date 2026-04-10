import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssessmentStatus,
  AttendanceStatus,
  Membership,
  OrganizationRole,
  PlatformRole,
  Prisma,
  User,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthTokenPayload } from '../auth/auth.types';
import { buildHandle, slugify } from '../common/strings';
import { hashPassword, verifyPassword } from '../common/passwords';
import type {
  AttendanceEntryDto,
  CreateChapterDto,
  CreateClassroomSubjectDto,
  GenerateAssessmentDto,
  LoginDto,
  ManualQuestionDto,
  RegisterStudentDto,
  RegisterTeacherDto,
  RegenerateQuestionDto,
  SaveAttemptAnswerDto,
  SaveAttendanceDto,
  ShareAssessmentResultsDto,
} from './dto/school.dto';
import {
  getChapterSyllabus,
  type ChapterSyllabus,
  type SyllabusQuestion,
  type SyllabusTopic,
} from './school.syllabus';

type AppUserRecord = User & {
  membership: Membership | null;
  homeOrganization: {
    id: string;
    name: string;
    slug: string;
    schoolCode: string | null;
  } | null;
  teacherClassrooms: Array<{
    subject: string;
    classroom: {
      id: string;
      name: string;
      grade: string;
      section: string | null;
      subject: string | null;
      joinCode: string;
      _count?: {
        studentEnrollments: number;
        assessments: number;
      };
    };
  }>;
  studentClassrooms: Array<{
    rollNumber: string | null;
    classroom: {
      id: string;
      name: string;
      grade: string;
      section: string | null;
      subject: string | null;
      joinCode: string;
      _count?: {
        assessments: number;
      };
    };
  }>;
};

type ClassroomSubjectRecord = {
  id: string;
  classroomId: string;
  createdByUserId: string;
  teacherUserId: string | null;
  name: string;
  displayOrder: number;
  themeColor: string | null;
  iconKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  classroom?: {
    id: string;
    name: string;
    grade: string;
    section: string | null;
    subject: string | null;
    joinCode: string;
    _count?: {
      studentEnrollments: number;
      assessments: number;
    };
  };
};

type SyllabusChapterRecord = {
  id: string;
  classroomSubjectId: string;
  createdByUserId: string;
  chapterKey: string;
  title: string;
  summary: string;
  sourcePdfUrl: string | null;
  videoUrl: string | null;
  topicItems: Prisma.JsonValue;
  aiContext: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  classroomSubject?: ClassroomSubjectRecord;
};

type AssessmentQuestionRecord = {
  id: string;
  assessmentId: string;
  externalKey: string | null;
  topicId: string | null;
  topicTitle: string;
  type: string;
  prompt: string;
  correctChoiceId: string;
  explanation: string;
  marks: number;
  position: number;
  optionsJson: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type AssessmentAttemptRecord = {
  id: string;
  assessmentId: string;
  studentId: string;
  status: 'in_progress' | 'submitted';
  score: number | null;
  totalMarks: number;
  startedAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  assessment?: {
    id: string;
    chapterTitle: string;
    chapterKey: string;
    subject: string;
    classroomId: string;
    classroom?: {
      id: string;
      name: string;
      subject: string | null;
    } | null;
  };
  student?: {
    id: string;
    name: string;
    handle: string;
  };
  answers?: Array<{
    id: string;
    questionId: string;
    selectedChoiceId: string | null;
    isCorrect: boolean | null;
    earnedMarks: number;
    question?: AssessmentQuestionRecord;
  }>;
};

@Injectable()
export class SchoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerTeacher(dto: RegisterTeacherDto) {
    const email = dto.email.trim().toLowerCase();
    const schoolCode = this.normalizeCode(dto.schoolCode);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const existingOrganization = await this.prisma.organization.findUnique({
      where: { schoolCode },
      select: { id: true },
    });

    if (existingOrganization) {
      throw new BadRequestException(
        'This school code is already in use. Use a different code for a new school.',
      );
    }

    const handle = await this.resolveAvailableHandle(buildHandle(dto.name));
    const organizationSlug = await this.resolveAvailableOrganizationSlug(
      dto.schoolName,
    );
    const classroomCode = await this.resolveAvailableClassroomCode(
      dto.classroomName,
    );
    const passwordHash = hashPassword(dto.password.trim());

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.schoolName.trim(),
          slug: organizationSlug,
          schoolCode,
          description: 'School workspace created from the Gurukul mobile app.',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: dto.name.trim(),
          handle,
          platformRole: PlatformRole.teacher,
          passwordHash,
          homeOrganizationId: organization.id,
        },
      });

      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: OrganizationRole.org_admin,
        },
      });

      const classroom = await tx.classroom.create({
        data: {
          organizationId: organization.id,
          createdByUserId: user.id,
          name: dto.classroomName.trim(),
          grade: dto.classroomName.trim(),
          subject: dto.subject.trim(),
          joinCode: classroomCode,
        },
      });

      const classroomSubject = await tx.classroomSubject.create({
        data: {
          classroomId: classroom.id,
          createdByUserId: user.id,
          teacherUserId: user.id,
          name: dto.subject.trim(),
          displayOrder: 0,
          themeColor: '#2D6AA1',
          iconKey: this.suggestSubjectIcon(dto.subject),
        },
      });

      await tx.classroomTeacher.create({
        data: {
          classroomId: classroom.id,
          userId: user.id,
          subject: dto.subject.trim(),
        },
      });

      const sciencePack = getChapterSyllabus('metals-and-non-metals');
      if (sciencePack && this.isScienceSubject(dto.subject)) {
        await tx.syllabusChapter.create({
          data: {
            classroomSubjectId: classroomSubject.id,
            createdByUserId: user.id,
            chapterKey: sciencePack.chapterKey,
            title: sciencePack.chapterTitle,
            summary: sciencePack.summary,
            sourcePdfUrl: sciencePack.sourcePdfUrl,
            videoUrl: sciencePack.videoUrl,
            topicItems: sciencePack.topics as unknown as Prisma.InputJsonValue,
            aiContext: {
              chapterKey: sciencePack.chapterKey,
              subject: sciencePack.subject,
              sourcePdfUrl: sciencePack.sourcePdfUrl,
              videoUrl: sciencePack.videoUrl,
            } as Prisma.InputJsonValue,
          },
        });
      }

      const schoolNoticesSlug = await this.resolveAvailableGroupSlug(
        tx,
        organization.id,
        'School Notices',
      );
      const classroomNoticesSlug = await this.resolveAvailableGroupSlug(
        tx,
        organization.id,
        `${dto.classroomName.trim()} Notices`,
      );

      await tx.group.create({
        data: {
          name: 'School Notices',
          slug: schoolNoticesSlug,
          description:
            'Official school-wide notices, alerts, and parent communication.',
          ownerOrganizationId: organization.id,
          createdByUserId: user.id,
          memberships: {
            create: {
              userId: user.id,
            },
          },
        },
      });

      await tx.group.create({
        data: {
          name: `${dto.classroomName.trim()} Notices`,
          slug: classroomNoticesSlug,
          description:
            'Classroom updates, homework reminders, and published assessment notices.',
          ownerOrganizationId: organization.id,
          createdByUserId: user.id,
          memberships: {
            create: {
              userId: user.id,
            },
          },
        },
      });

      return {
        userId: user.id,
      };
    });

    return this.createAuthResponse(result.userId);
  }

  async registerStudent(dto: RegisterStudentDto) {
    const email = dto.email.trim().toLowerCase();
    const schoolCode = this.normalizeCode(dto.schoolCode);
    const classroomCode = this.normalizeCode(dto.classroomCode);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { schoolCode },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('No school was found for the given school code.');
    }

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        organizationId: organization.id,
        joinCode: classroomCode,
      },
      select: { id: true, name: true },
    });

    if (!classroom) {
      throw new NotFoundException(
        'No classroom was found for the given classroom code.',
      );
    }

    const handle = await this.resolveAvailableHandle(buildHandle(dto.name));
    const passwordHash = hashPassword(dto.password.trim());

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: dto.name.trim(),
          handle,
          platformRole: PlatformRole.student,
          passwordHash,
          homeOrganizationId: organization.id,
        },
      });

      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: OrganizationRole.student,
        },
      });

      await tx.classroomStudent.create({
        data: {
          classroomId: classroom.id,
          userId: user.id,
          rollNumber: dto.rollNumber?.trim() || null,
        },
      });

      const groupNames = new Set<string>([
        'School Notices',
        `${classroom.name} Notices`,
      ]);

      const groups = await tx.group.findMany({
        where: {
          ownerOrganizationId: organization.id,
          name: {
            in: [...groupNames],
          },
        },
        select: {
          id: true,
        },
      });

      await Promise.all(
        groups.map((group) =>
          tx.groupMembership.upsert({
            where: {
              groupId_userId: {
                groupId: group.id,
                userId: user.id,
              },
            },
            create: {
              groupId: group.id,
              userId: user.id,
            },
            update: {},
          }),
        ),
      );

      return {
        userId: user.id,
      };
    });

    return this.createAuthResponse(result.userId);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash || !verifyPassword(dto.password.trim(), user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createAuthResponse(user.id);
  }

  async getMe(actor: AuthTokenPayload) {
    const user = await this.getUserRecord(actor.sub);
    return {
      user: this.mapUser(user),
    };
  }

  async getTeacherDashboard(actor: AuthTokenPayload) {
    this.assertTeacher(actor);
    const user = await this.getUserRecord(actor.sub);

    const classroomIds = user.teacherClassrooms.map((item) => item.classroom.id);
    const subjectRecords = await this.prisma.classroomSubject.findMany({
      where: {
        classroomId: {
          in: classroomIds,
        },
      },
      select: {
        classroomId: true,
      },
    });
    const currentAttendanceKey = this.currentAttendanceKey();
    const [draftCount, publishedCount, attendancePendingCount, recentSubmissionCount] =
      await this.prisma.$transaction([
      this.prisma.assessment.count({
        where: {
          classroomId: { in: classroomIds },
          status: AssessmentStatus.draft,
        },
      }),
      this.prisma.assessment.count({
        where: {
          classroomId: { in: classroomIds },
          status: AssessmentStatus.published,
        },
      }),
      this.prisma.attendanceSession.count({
        where: {
          classroomId: {
            in: classroomIds,
          },
          attendanceKey: currentAttendanceKey,
        },
      }),
      this.prisma.assessmentAttempt.count({
        where: {
          assessment: {
            classroomId: {
              in: classroomIds,
            },
          },
          status: 'submitted',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const subjectCountByClassroom = subjectRecords.reduce<Record<string, number>>(
      (acc, subject) => {
        acc[subject.classroomId] = (acc[subject.classroomId] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return {
      organization: user.homeOrganization,
      classrooms: user.teacherClassrooms.map((item) => ({
        id: item.classroom.id,
        name: item.classroom.name,
        subject: item.subject,
        joinCode: item.classroom.joinCode,
        studentCount: item.classroom._count?.studentEnrollments ?? 0,
        subjectCount: subjectCountByClassroom[item.classroom.id] ?? 0,
      })),
      metrics: {
        classroomCount: user.teacherClassrooms.length,
        subjectCount: subjectRecords.length,
        draftCount,
        publishedCount,
        recentSubmissionCount,
        todayAttendancePending: classroomIds.length > 0 && attendancePendingCount === 0,
      },
    };
  }

  async getStudentDashboard(actor: AuthTokenPayload) {
    this.assertStudent(actor);
    const user = await this.getUserRecord(actor.sub);
    const classroomIds = user.studentClassrooms.map((item) => item.classroom.id);
    const results = await this.getStudentResults(actor);
    const publishedAssessments = await this.prisma.assessment.findMany({
      where: {
        classroomId: { in: classroomIds },
        status: AssessmentStatus.published,
      },
      include: {
        classroom: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 5,
    });

    return {
      organization: user.homeOrganization,
      classrooms: user.studentClassrooms.map((item) => ({
        id: item.classroom.id,
        name: item.classroom.name,
        subject: item.classroom.subject,
        joinCode: item.classroom.joinCode,
        rollNumber: item.rollNumber,
      })),
      metrics: {
        classroomCount: user.studentClassrooms.length,
        publishedTestCount: publishedAssessments.length,
        attendancePercentage: results.metrics.attendancePercentage,
        averageScore: results.metrics.averageScore,
        scoredCount: results.metrics.scoredCount,
      },
      recentAssessments: publishedAssessments.map((assessment) =>
        this.mapAssessment(assessment),
      ),
      attendanceSummary: results.attendanceSummary,
      subjectProgress: results.subjectProgress,
      recentResults: results.recentResults,
      weakTopics: results.weakTopics,
    };
  }

  async getTeacherClassrooms(actor: AuthTokenPayload) {
    this.assertTeacher(actor);
    const user = await this.getUserRecord(actor.sub);
    return {
      items: user.teacherClassrooms.map((item) => ({
        id: item.classroom.id,
        name: item.classroom.name,
        subject: item.subject,
        joinCode: item.classroom.joinCode,
        studentCount: item.classroom._count?.studentEnrollments ?? 0,
      })),
    };
  }

  async listClassroomSubjects(actor: AuthTokenPayload, classroomId: string) {
    const classroom = await this.getAccessibleClassroom(actor, classroomId);

    const items = await this.prisma.classroomSubject.findMany({
      where: {
        classroomId: classroom.id,
      },
      include: {
        chapters: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        joinCode: classroom.joinCode,
      },
      items: items.map((subject) => this.mapClassroomSubject(subject)),
    };
  }

  async createClassroomSubject(
    actor: AuthTokenPayload,
    classroomId: string,
    dto: CreateClassroomSubjectDto,
  ) {
    const classroom = await this.getTeacherClassroom(actor, classroomId);

    const subject = await this.prisma.classroomSubject.upsert({
      where: {
        classroomId_name: {
          classroomId: classroom.id,
          name: dto.name.trim(),
        },
      },
      create: {
        classroomId: classroom.id,
        createdByUserId: actor.sub,
        teacherUserId: dto.teacherUserId?.trim() || actor.sub,
        name: dto.name.trim(),
        displayOrder: await this.resolveNextSubjectOrder(classroom.id),
        themeColor: dto.themeColor?.trim() || '#2D6AA1',
        iconKey: dto.iconKey?.trim() || this.suggestSubjectIcon(dto.name),
      },
      update: {
        teacherUserId: dto.teacherUserId?.trim() || actor.sub,
        themeColor: dto.themeColor?.trim() || undefined,
        iconKey: dto.iconKey?.trim() || undefined,
      },
      include: {
        chapters: true,
      },
    });

    await this.seedDefaultChapterForSubject(subject, actor.sub, dto.name);

    return {
      subject: this.mapClassroomSubject(subject),
    };
  }

  async listSubjectChapters(actor: AuthTokenPayload, subjectId: string) {
    const subject = await this.getAccessibleSubject(actor, subjectId);

    const chapters = await this.prisma.syllabusChapter.findMany({
      where: {
        classroomSubjectId: subject.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      subject: this.mapClassroomSubject(subject),
      items: chapters.map((chapter) => this.mapChapterSummary(chapter)),
    };
  }

  async createChapter(actor: AuthTokenPayload, dto: CreateChapterDto) {
    const subject = await this.getTeacherSubject(actor, dto.classroomSubjectId);
    const sourcePack = getChapterSyllabus(dto.chapterKey);
    const topicItems =
      sourcePack?.topics ?? ([] as SyllabusTopic[]);

    const chapter = await this.prisma.syllabusChapter.upsert({
      where: {
        chapterKey: dto.chapterKey.trim(),
      },
      create: {
        classroomSubjectId: subject.id,
        createdByUserId: actor.sub,
        chapterKey: dto.chapterKey.trim(),
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        sourcePdfUrl: dto.sourcePdfUrl?.trim() || sourcePack?.sourcePdfUrl || null,
        videoUrl: dto.videoUrl?.trim() || sourcePack?.videoUrl || null,
        topicItems: (sourcePack?.topics ?? []) as unknown as Prisma.InputJsonValue,
        aiContext: {
          subject: subject.name,
          chapterTitle: dto.title.trim(),
          sourcePdfUrl: dto.sourcePdfUrl?.trim() || sourcePack?.sourcePdfUrl || null,
          videoUrl: dto.videoUrl?.trim() || sourcePack?.videoUrl || null,
        } as Prisma.InputJsonValue,
      },
      update: {
        classroomSubjectId: subject.id,
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        sourcePdfUrl: dto.sourcePdfUrl?.trim() || sourcePack?.sourcePdfUrl || null,
        videoUrl: dto.videoUrl?.trim() || sourcePack?.videoUrl || null,
        topicItems: (sourcePack?.topics ?? topicItems) as unknown as Prisma.InputJsonValue,
        aiContext: {
          subject: subject.name,
          chapterTitle: dto.title.trim(),
          sourcePdfUrl: dto.sourcePdfUrl?.trim() || sourcePack?.sourcePdfUrl || null,
          videoUrl: dto.videoUrl?.trim() || sourcePack?.videoUrl || null,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      chapter: this.mapChapterSummary(chapter),
    };
  }

  getLesson(chapterKey: string) {
    return this.loadLessonByChapterKey(chapterKey);
  }

  async generateDraftAssessment(
    actor: AuthTokenPayload,
    dto: GenerateAssessmentDto,
  ) {
    this.assertTeacher(actor);
    const classroom = await this.getTeacherClassroom(actor, dto.classroomId);
    const chapter = await this.requireChapter(dto.chapterKey);

    const requestedSubjectId = dto.classroomSubjectId?.trim();
    let classroomSubject =
      (requestedSubjectId
        ? classroom.subjects.find((subject) => subject.id === requestedSubjectId) ?? null
        : null) ??
      classroom.subjects.find(
        (subject) => subject.name.trim().toLowerCase() === chapter.subject.trim().toLowerCase(),
      ) ??
      classroom.subjects[0] ??
      null;

    if (!classroomSubject) {
      classroomSubject = await this.prisma.classroomSubject.create({
        data: {
          classroomId: classroom.id,
          createdByUserId: actor.sub,
          teacherUserId: actor.sub,
          name: chapter.subject,
          displayOrder: await this.resolveNextSubjectOrder(classroom.id),
          themeColor: '#2D6AA1',
          iconKey: this.suggestSubjectIcon(chapter.subject),
        },
        include: {
          chapters: true,
        },
      });
    }

    const chapterRecord = await this.ensureChapterRecordForLesson(
      classroomSubject as ClassroomSubjectRecord,
      chapter,
      actor.sub,
    );

    const selectedTopics = chapter.topics.filter((topic) =>
      dto.topicIds.includes(topic.id),
    );

    if (selectedTopics.length === 0) {
      throw new BadRequestException('Select at least one topic to generate a test.');
    }

    const questionLimit = dto.totalMarks <= 10 ? 4 : dto.totalMarks <= 15 ? 5 : 6;
    const questionItems = this.buildQuestionItems(selectedTopics).slice(
      0,
      questionLimit,
    );

    const assessment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assessment.create({
        data: {
          classroomId: classroom.id,
          createdByUserId: actor.sub,
          classroomSubjectId: classroomSubject.id,
          syllabusChapterId: chapterRecord.id,
          chapterKey: chapter.chapterKey,
          chapterTitle: chapter.chapterTitle,
          subject: chapter.subject,
          difficulty: dto.difficulty,
          totalMarks: dto.totalMarks,
          sourcePdfUrl: chapter.sourcePdfUrl,
          videoUrl: chapter.videoUrl,
          topicIds: dto.topicIds,
          questionItems: questionItems as unknown as Prisma.InputJsonValue,
        },
        include: {
          classroom: true,
        },
      });

      await this.syncAssessmentQuestions(
        tx,
        created.id,
        questionItems as Array<{
          id: string;
          topicId?: string | null;
          topicTitle: string;
          type: string;
          prompt: string;
          correctChoiceId: string;
          explanation: string;
          marks?: number;
          options: Array<{ id: string; label: string }>;
        }>,
      );

      return created;
    });

    return {
      assessment: this.mapAssessment(assessment),
    };
  }

  async publishAssessment(actor: AuthTokenPayload, assessmentId: string) {
    this.assertTeacher(actor);
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    const canManage =
      assessment.createdByUserId === actor.sub ||
      assessment.classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin;

    if (!canManage) {
      throw new ForbiddenException('You cannot publish this assessment.');
    }

    const updated = await this.prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: AssessmentStatus.published,
        publishedAt: new Date(),
      },
      include: {
        classroom: true,
      },
    });

    return {
      assessment: this.mapAssessment(updated),
    };
  }

  async listTeacherAssessments(actor: AuthTokenPayload) {
    this.assertTeacher(actor);

    const assessments = await this.prisma.assessment.findMany({
      where: {
        OR: [
          { createdByUserId: actor.sub },
          {
            classroom: {
              teacherAssignments: {
                some: {
                  userId: actor.sub,
                },
              },
            },
          },
        ],
      },
      include: {
        classroom: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      items: assessments.map((assessment) => this.mapAssessment(assessment)),
    };
  }

  async listStudentAssessments(actor: AuthTokenPayload) {
    this.assertStudent(actor);

    const enrollments = await this.prisma.classroomStudent.findMany({
      where: {
        userId: actor.sub,
      },
      select: {
        classroomId: true,
      },
    });

    const classroomIds = enrollments.map((item) => item.classroomId);
    const assessments = await this.prisma.assessment.findMany({
      where: {
        classroomId: { in: classroomIds },
        status: AssessmentStatus.published,
      },
      include: {
        classroom: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    const attemptRecords = await this.prisma.assessmentAttempt.findMany({
      where: {
        studentId: actor.sub,
        assessmentId: {
          in: assessments.map((assessment) => assessment.id),
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    const attemptMap = new Map(attemptRecords.map((attempt) => [attempt.assessmentId, attempt]));

    return {
      items: assessments.map((assessment) => {
        const attempt = attemptMap.get(assessment.id);
        return this.mapAssessment(
          {
            ...assessment,
            attemptStatus: attempt?.status ?? 'not_started',
            studentScore: attempt?.score ?? null,
            submittedAt: attempt?.submittedAt ?? null,
          },
          { includeQuestions: false },
        );
      }),
    };
  }

  async getAssessment(actor: AuthTokenPayload, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
            studentEnrollments: true,
          },
        },
        questions: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    if (actor.platformRole === PlatformRole.student) {
      const isEnrolled = assessment.classroom.studentEnrollments.some(
        (enrollment) => enrollment.userId === actor.sub,
      );
      if (!isEnrolled || assessment.status !== AssessmentStatus.published) {
        throw new ForbiddenException('This assessment is not available yet.');
      }
    } else {
      const canView =
        assessment.createdByUserId === actor.sub ||
        assessment.classroom.teacherAssignments.some(
          (assignment) => assignment.userId === actor.sub,
        ) ||
        actor.organizationRole === OrganizationRole.org_admin;
      if (!canView) {
        throw new ForbiddenException('You cannot view this assessment.');
      }
    }

    const attempt =
      actor.platformRole === PlatformRole.student
        ? await this.prisma.assessmentAttempt.findUnique({
            where: {
              assessmentId_studentId: {
                assessmentId: assessment.id,
                studentId: actor.sub,
              },
            },
          })
        : null;

    return {
      assessment: this.mapAssessment(
        {
          ...assessment,
          attemptStatus: attempt?.status ?? 'not_started',
          studentScore: attempt?.score ?? null,
          submittedAt: attempt?.submittedAt ?? null,
        },
        { includeQuestions: true },
      ),
    };
  }

  private async loadLessonByChapterKey(chapterKey: string) {
    const chapter = await this.prisma.syllabusChapter.findUnique({
      where: {
        chapterKey,
      },
      include: {
        classroomSubject: {
          include: {
            classroom: true,
          },
        },
      },
    });

    if (chapter) {
      return this.mapLessonChapter(chapter);
    }

    const fallback = getChapterSyllabus(chapterKey);
    if (!fallback) {
      throw new NotFoundException('No chapter pack is available for this lesson yet.');
    }

    return fallback;
  }

  private mapLessonChapter(chapter: SyllabusChapterRecord) {
    const topics = this.normalizeTopicItems(chapter.topicItems);
    const subjectName =
      chapter.classroomSubject?.name ??
      chapter.classroomSubject?.classroom?.subject ??
      'Subject';

    return {
      chapterKey: chapter.chapterKey,
      chapterTitle: chapter.title,
      subject: subjectName,
      summary: chapter.summary,
      sourcePdfUrl: chapter.sourcePdfUrl ?? '',
      videoUrl: chapter.videoUrl ?? '',
      topics,
    };
  }

  private mapClassroomSubject(subject: ClassroomSubjectRecord & { chapters?: SyllabusChapterRecord[] }) {
    return {
      id: subject.id,
      classroomId: subject.classroomId,
      name: subject.name,
      displayOrder: subject.displayOrder,
      themeColor: subject.themeColor,
      iconKey: subject.iconKey,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      teacherUserId: subject.teacherUserId,
      chapterCount: subject.chapters?.length ?? 0,
      chapters: (subject.chapters ?? []).map((chapter) => this.mapChapterSummary(chapter)),
    };
  }

  private mapChapterSummary(chapter: SyllabusChapterRecord) {
    const topicItems = this.normalizeTopicItems(chapter.topicItems);
    return {
      id: chapter.id,
      classroomSubjectId: chapter.classroomSubjectId,
      chapterKey: chapter.chapterKey,
      title: chapter.title,
      summary: chapter.summary,
      sourcePdfUrl: chapter.sourcePdfUrl,
      videoUrl: chapter.videoUrl,
      topicCount: topicItems.length,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  private normalizeTopicItems(topicItems: Prisma.JsonValue): SyllabusTopic[] {
    return Array.isArray(topicItems)
      ? (topicItems as unknown as SyllabusTopic[])
      : [];
  }

  private normalizeQuestionItems(questionItems: Prisma.JsonValue) {
    return Array.isArray(questionItems)
      ? (questionItems as unknown as Array<{
          id: string;
          topicId?: string | null;
          topicTitle: string;
          type: string;
          prompt: string;
          correctChoiceId: string;
          explanation: string;
          marks?: number;
          options: Array<{ id: string; label: string }>;
        }>)
      : [];
  }

  private suggestSubjectIcon(subjectName: string) {
    const value = subjectName.trim().toLowerCase();
    if (value.includes('science')) return 'science';
    if (value.includes('math')) return 'calculate';
    if (value.includes('english') || value.includes('language')) return 'menu_book';
    if (value.includes('history') || value.includes('civics')) return 'account_balance';
    if (value.includes('geography')) return 'public';
    if (value.includes('marathi') || value.includes('hindi')) return 'translate';
    return 'school';
  }

  private isScienceSubject(subjectName: string) {
    return subjectName.trim().toLowerCase().includes('science');
  }

  private async resolveNextSubjectOrder(classroomId: string) {
    const aggregate = await this.prisma.classroomSubject.aggregate({
      where: {
        classroomId,
      },
      _max: {
        displayOrder: true,
      },
    });

    return (aggregate._max.displayOrder ?? -1) + 1;
  }

  private async seedDefaultChapterForSubject(
    subject: ClassroomSubjectRecord,
    actorId: string,
    subjectName: string,
  ) {
    if (!this.isScienceSubject(subjectName)) {
      return;
    }

    const existing = await this.prisma.syllabusChapter.findUnique({
      where: {
        chapterKey: 'metals-and-non-metals',
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return;
    }

    const pack = getChapterSyllabus('metals-and-non-metals');
    if (!pack) {
      return;
    }

    await this.prisma.syllabusChapter.create({
      data: {
        classroomSubjectId: subject.id,
        createdByUserId: actorId,
        chapterKey: pack.chapterKey,
        title: pack.chapterTitle,
        summary: pack.summary,
        sourcePdfUrl: pack.sourcePdfUrl,
        videoUrl: pack.videoUrl,
        topicItems: pack.topics as unknown as Prisma.InputJsonValue,
        aiContext: {
          chapterKey: pack.chapterKey,
          subject: pack.subject,
          sourcePdfUrl: pack.sourcePdfUrl,
          videoUrl: pack.videoUrl,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async getAccessibleClassroom(actor: AuthTokenPayload, classroomId: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: {
        id: classroomId,
      },
      include: {
        teacherAssignments: true,
        studentEnrollments: true,
        subjects: {
          include: {
            chapters: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        _count: {
          select: {
            studentEnrollments: true,
            assessments: true,
            subjects: true,
          },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found.');
    }

    const canAccess =
      actor.platformRole === PlatformRole.platform_admin ||
      classroom.organizationId === actor.homeOrganizationId ||
      classroom.teacherAssignments.some((assignment) => assignment.userId === actor.sub) ||
      classroom.studentEnrollments.some((enrollment) => enrollment.userId === actor.sub);

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this classroom.');
    }

    return classroom;
  }

  private async getAccessibleSubject(actor: AuthTokenPayload, subjectId: string) {
    const subject = await this.prisma.classroomSubject.findUnique({
      where: {
        id: subjectId,
      },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
            studentEnrollments: true,
            _count: {
              select: {
                studentEnrollments: true,
                assessments: true,
                subjects: true,
              },
            },
          },
        },
        chapters: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    const classroom = subject.classroom;
    const canAccess =
      actor.platformRole === PlatformRole.platform_admin ||
      classroom.organizationId === actor.homeOrganizationId ||
      classroom.teacherAssignments.some((assignment) => assignment.userId === actor.sub) ||
      classroom.studentEnrollments.some((enrollment) => enrollment.userId === actor.sub);

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this subject.');
    }

    return subject;
  }

  private async getTeacherSubject(actor: AuthTokenPayload, subjectId: string) {
    const subject = await this.getAccessibleSubject(actor, subjectId);
    const isTeacher =
      actor.platformRole === PlatformRole.platform_admin ||
      subject.classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin;

    if (!isTeacher) {
      throw new ForbiddenException('Teacher access is required.');
    }

    return subject;
  }

  private async ensureChapterRecordForLesson(
    subject: ClassroomSubjectRecord,
    lesson: {
      chapterKey: string;
      chapterTitle: string;
      subject: string;
      summary: string;
      sourcePdfUrl: string;
      videoUrl: string;
      topics: SyllabusTopic[];
    },
    actorId: string,
  ) {
    const existing = await this.prisma.syllabusChapter.findUnique({
      where: {
        chapterKey: lesson.chapterKey,
      },
    });

    const topicItems = lesson.topics as unknown as Prisma.InputJsonValue;

    if (existing) {
      return this.prisma.syllabusChapter.update({
        where: {
          id: existing.id,
        },
        data: {
          classroomSubjectId: subject.id,
          createdByUserId: actorId,
          title: lesson.chapterTitle,
          summary: lesson.summary,
          sourcePdfUrl: lesson.sourcePdfUrl || null,
          videoUrl: lesson.videoUrl || null,
          topicItems,
          aiContext: {
            chapterKey: lesson.chapterKey,
            subject: lesson.subject,
            sourcePdfUrl: lesson.sourcePdfUrl,
            videoUrl: lesson.videoUrl,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return this.prisma.syllabusChapter.create({
      data: {
        classroomSubjectId: subject.id,
        createdByUserId: actorId,
        chapterKey: lesson.chapterKey,
        title: lesson.chapterTitle,
        summary: lesson.summary,
        sourcePdfUrl: lesson.sourcePdfUrl || null,
        videoUrl: lesson.videoUrl || null,
        topicItems,
        aiContext: {
          chapterKey: lesson.chapterKey,
          subject: lesson.subject,
          sourcePdfUrl: lesson.sourcePdfUrl,
          videoUrl: lesson.videoUrl,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async syncAssessmentQuestions(
    tx: Prisma.TransactionClient,
    assessmentId: string,
    questionItems: Array<{
      id: string;
      topicId?: string | null;
      topicTitle: string;
      type: string;
      prompt: string;
      correctChoiceId: string;
      explanation: string;
      marks?: number;
      options: Array<{ id: string; label: string }>;
    }>,
  ) {
    await tx.assessmentQuestion.deleteMany({
      where: {
        assessmentId,
      },
    });

    if (questionItems.length === 0) {
      return;
    }

    await tx.assessmentQuestion.createMany({
      data: questionItems.map((item, index) => ({
        assessmentId,
        externalKey: item.id,
        topicId: item.topicId ?? null,
        topicTitle: item.topicTitle,
        type: item.type,
        prompt: item.prompt,
        correctChoiceId: item.correctChoiceId,
        explanation: item.explanation,
        marks: item.marks ?? 1,
        position: index,
        optionsJson: item.options as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  private mapQuestionItem(question: {
    id: string;
    topicId?: string | null;
    topicTitle: string;
    type: string;
    prompt: string;
    correctChoiceId: string;
    explanation: string;
    marks?: number;
    options: Array<{ id: string; label: string }>;
  }) {
    return {
      id: question.id,
      topicId: question.topicId ?? null,
      topicTitle: question.topicTitle,
      type: question.type,
      prompt: question.prompt,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
      marks: question.marks ?? 1,
      options: question.options,
    };
  }

  private mapAssessmentQuestionRow(question: {
    id: string;
    externalKey: string | null;
    topicId: string | null;
    topicTitle: string;
    type: string;
    prompt: string;
    correctChoiceId: string;
    explanation: string;
    marks: number;
    optionsJson: Prisma.JsonValue;
  }) {
    const options = Array.isArray(question.optionsJson) ? question.optionsJson : [];
    return {
      id: question.externalKey ?? question.id,
      rowId: question.id,
      topicId: question.topicId,
      topicTitle: question.topicTitle,
      type: question.type,
      prompt: question.prompt,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
      marks: question.marks,
      options: options.map((option) => option as { id: string; label: string }),
    };
  }

  private mapAttempt(attempt: {
    id: string;
    assessmentId: string;
    studentId: string;
    status: string;
    score: number | null;
    totalMarks: number;
    startedAt: Date;
    updatedAt: Date;
    submittedAt: Date | null;
    answers?: Array<{
      id: string;
      questionId: string;
      selectedChoiceId: string | null;
      isCorrect: boolean | null;
      earnedMarks: number;
      question?: AssessmentQuestionRecord;
    }>;
    student?: {
      id: string;
      name: string;
      handle: string;
    };
    assessment?: {
      id: string;
      chapterTitle: string;
      chapterKey: string;
      subject: string;
      classroomId: string;
      classroom?: {
        id: string;
        name: string;
        subject: string | null;
      } | null;
    };
  }) {
    return {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      studentId: attempt.studentId,
      status: attempt.status,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      startedAt: attempt.startedAt,
      updatedAt: attempt.updatedAt,
      submittedAt: attempt.submittedAt,
      student: attempt.student,
      assessment: attempt.assessment,
      answers: attempt.answers?.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        selectedChoiceId: answer.selectedChoiceId,
        isCorrect: answer.isCorrect,
        earnedMarks: answer.earnedMarks,
        question: answer.question ? this.mapAssessmentQuestionRow(answer.question) : null,
      })),
    };
  }

  private parseAssessmentQuestions(assessment: {
    questions?: Prisma.JsonValue;
  }) {
    return Array.isArray(assessment.questions) ? assessment.questions : [];
  }

  private computeAttendanceKey(input: string) {
    const value = input.trim();
    if (!value) {
      return this.currentAttendanceKey();
    }
    return value;
  }

  private currentAttendanceKey() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(new Date());
  }

  private toAttendanceDate(attendanceKey: string) {
    return new Date(`${attendanceKey}T00:00:00.000Z`);
  }

  private async createResultsBroadcast(
    assessment: {
      id: string;
      chapterTitle: string;
      chapterKey: string;
      subject: string;
      classroomId: string;
      classroom?: {
        id: string;
        name: string;
        organizationId: string;
      };
    },
    actor: AuthTokenPayload,
  ) {
    if (!assessment.classroom) {
      return null;
    }

    const groupName = `${assessment.classroom.name} Notices`;
    const group = await this.prisma.group.findFirst({
      where: {
        ownerOrganizationId: assessment.classroom.organizationId,
        name: groupName,
      },
    });

    const noticeGroup =
      group ??
      (await this.prisma.group.findFirst({
        where: {
          ownerOrganizationId: assessment.classroom.organizationId,
          name: 'School Notices',
        },
      }));

    if (!noticeGroup) {
      return null;
    }

    const post = await this.prisma.post.create({
      data: {
        groupId: noticeGroup.id,
        authorId: actor.sub,
        title: `${assessment.chapterTitle} results are ready`,
        body:
          'The test results are now available. Students can open the Results tab to review their score, answers, and explanations.',
      },
    });

    return {
      groupId: noticeGroup.id,
      postId: post.id,
    };
  }

  async regenerateAssessmentQuestion(
    actor: AuthTokenPayload,
    assessmentId: string,
    dto: RegenerateQuestionDto,
  ) {
    this.assertTeacher(actor);

    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    const canManage =
      assessment.createdByUserId === actor.sub ||
      assessment.classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin;

    if (!canManage) {
      throw new ForbiddenException('You cannot update this assessment.');
    }

    const questions = this.normalizeQuestionItems(assessment.questionItems);

    const index = questions.findIndex((question) => question.id === dto.questionId);
    if (index < 0) {
      throw new NotFoundException('Question not found.');
    }

    const current = questions[index];
    const refreshed = this.buildQuestionVariant(current, dto.topicId);
    questions[index] = refreshed;

    const updated = await this.prisma.$transaction(async (tx) => {
      const assessmentRow = await tx.assessment.update({
        where: {
          id: assessment.id,
        },
        data: {
          questionItems: questions as unknown as Prisma.InputJsonValue,
        },
        include: {
          classroom: true,
        },
      });

      await this.syncAssessmentQuestions(tx, assessmentRow.id, questions);

      return assessmentRow;
    });

    return {
      assessment: this.mapAssessment(updated, { includeQuestions: true }),
    };
  }

  async addManualQuestion(
    actor: AuthTokenPayload,
    assessmentId: string,
    dto: ManualQuestionDto,
  ) {
    this.assertTeacher(actor);

    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    const canManage =
      assessment.createdByUserId === actor.sub ||
      assessment.classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin;

    if (!canManage) {
      throw new ForbiddenException('You cannot update this assessment.');
    }

    const questions = this.normalizeQuestionItems(assessment.questionItems);

    const questionId = `manual-${Date.now()}-${questions.length + 1}`;
    questions.push({
      id: questionId,
      topicId: null,
      topicTitle: dto.topicTitle.trim(),
      type: 'mcq',
      prompt: dto.prompt.trim(),
      correctChoiceId: dto.correctChoiceId.trim(),
      explanation: dto.explanation.trim(),
      marks: dto.marks ?? 1,
      options: dto.options.map((option) => ({
        id: option.id.trim(),
        label: option.label.trim(),
      })),
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const assessmentRow = await tx.assessment.update({
        where: {
          id: assessment.id,
        },
        data: {
          questionItems: questions as unknown as Prisma.InputJsonValue,
        },
        include: {
          classroom: true,
        },
      });

      await this.syncAssessmentQuestions(tx, assessmentRow.id, questions);

      return assessmentRow;
    });

    return {
      assessment: this.mapAssessment(updated, { includeQuestions: true }),
    };
  }

  async startAttempt(actor: AuthTokenPayload, assessmentId: string) {
    this.assertStudent(actor);

    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        classroom: {
          include: {
            studentEnrollments: true,
            teacherAssignments: true,
          },
        },
        questions: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    const isEnrolled = assessment.classroom.studentEnrollments.some(
      (enrollment) => enrollment.userId === actor.sub,
    );

    if (!isEnrolled || assessment.status !== AssessmentStatus.published) {
      throw new ForbiddenException('This assessment is not available yet.');
    }

    const attempt =
      (await this.prisma.assessmentAttempt.findUnique({
        where: {
          assessmentId_studentId: {
            assessmentId: assessment.id,
            studentId: actor.sub,
          },
        },
        include: {
          assessment: {
            include: {
              classroom: true,
            },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
      })) ??
      (await this.prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentId: actor.sub,
          totalMarks: assessment.totalMarks,
          status: 'in_progress',
        },
        include: {
          assessment: {
            include: {
              classroom: true,
            },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
      }));

    return {
      attempt: this.mapAttempt(attempt as unknown as Parameters<typeof this.mapAttempt>[0]),
      assessment: this.mapAssessment(
        {
          ...assessment,
          questionItems: assessment.questionItems,
          questions: assessment.questions,
        },
        { includeQuestions: true },
      ),
    };
  }

  async saveAttemptAnswer(
    actor: AuthTokenPayload,
    attemptId: string,
    dto: SaveAttemptAnswerDto,
  ) {
    this.assertStudent(actor);

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        assessment: {
          include: {
            classroom: {
              include: {
                studentEnrollments: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found.');
    }

    if (attempt.studentId !== actor.sub) {
      throw new ForbiddenException('You cannot edit this attempt.');
    }

    if (attempt.status === 'submitted') {
      throw new ForbiddenException('This attempt has already been submitted.');
    }

    const question = await this.prisma.assessmentQuestion.findFirst({
      where: {
        assessmentId: attempt.assessmentId,
        OR: [
          {
            id: dto.questionId,
          },
          {
            externalKey: dto.questionId,
          },
        ],
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    const selectedChoiceId = dto.selectedChoiceId?.trim() || null;
    const isCorrect = selectedChoiceId ? selectedChoiceId === question.correctChoiceId : false;
    const earnedMarks = isCorrect ? question.marks : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: question.id,
          },
        },
        create: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedChoiceId,
          isCorrect,
          earnedMarks,
        },
        update: {
          selectedChoiceId,
          isCorrect,
          earnedMarks,
        },
      });

      return tx.assessmentAttempt.findUniqueOrThrow({
        where: {
          id: attempt.id,
        },
        include: {
          assessment: {
            include: {
              classroom: true,
            },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
      });
    });

    return {
      attempt: this.mapAttempt(updated as unknown as Parameters<typeof this.mapAttempt>[0]),
    };
  }

  async submitAttempt(actor: AuthTokenPayload, attemptId: string) {
    this.assertStudent(actor);

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        assessment: {
          include: {
            classroom: {
              include: {
                studentEnrollments: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found.');
    }

    if (attempt.studentId !== actor.sub) {
      throw new ForbiddenException('You cannot submit this attempt.');
    }

    if (attempt.status === 'submitted') {
      return {
        attempt: this.mapAttempt(attempt as unknown as Parameters<typeof this.mapAttempt>[0]),
      };
    }

    const score = attempt.answers.reduce((sum, answer) => sum + answer.earnedMarks, 0);

    const updated = await this.prisma.assessmentAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: 'submitted',
        score,
        submittedAt: new Date(),
      },
      include: {
        assessment: {
          include: {
            classroom: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    return {
      attempt: this.mapAttempt(updated as unknown as Parameters<typeof this.mapAttempt>[0]),
    };
  }

  async listAssessmentResults(actor: AuthTokenPayload, assessmentId: string) {
    this.assertTeacher(actor);

    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
          },
        },
        questions: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    const canManage =
      assessment.createdByUserId === actor.sub ||
      assessment.classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin;

    if (!canManage) {
      throw new ForbiddenException('You cannot view these results.');
    }

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        assessmentId: assessment.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            handle: true,
          },
        },
        assessment: {
          select: {
            id: true,
            chapterTitle: true,
            chapterKey: true,
            subject: true,
            classroomId: true,
            classroom: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const submittedAttempts = attempts.filter((item) => item.status === 'submitted');
    const totalScore = submittedAttempts.reduce((sum, item) => sum + (item.score ?? 0), 0);
    const averageScore = submittedAttempts.length
      ? Math.round((totalScore / submittedAttempts.length) * 10) / 10
      : 0;

    return {
      assessment: this.mapAssessment(
        {
          ...assessment,
          questionItems: assessment.questionItems,
          questions: assessment.questions,
        },
        { includeQuestions: true },
      ),
      summary: {
        submissionCount: submittedAttempts.length,
        averageScore,
        maxScore: assessment.totalMarks,
      },
      items: attempts.map((attempt) =>
        this.mapAttempt(attempt as unknown as Parameters<typeof this.mapAttempt>[0]),
      ),
    };
  }

  async shareAssessmentResults(
    actor: AuthTokenPayload,
    assessmentId: string,
    dto: ShareAssessmentResultsDto,
  ) {
    this.assertTeacher(actor);

    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        classroom: {
          include: {
            teacherAssignments: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    const canManage =
      assessment.createdByUserId === actor.sub ||
      assessment.classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin;

    if (!canManage) {
      throw new ForbiddenException('You cannot share these results.');
    }

    const updated = await this.prisma.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        resultsSharedAt: new Date(),
        resultsSharedByUserId: actor.sub,
      },
      include: {
        classroom: true,
      },
    });

    const broadcast = dto.groupId
      ? await this.prisma.post.create({
          data: {
            groupId: dto.groupId,
            authorId: actor.sub,
            title: `${updated.chapterTitle} results are ready`,
            body:
              'The teacher has shared the latest test results. Students can open the Results tab to review performance and explanations.',
          },
        }).then((post) => ({ groupId: dto.groupId!, postId: post.id }))
      : await this.createResultsBroadcast(updated, actor);

    return {
      assessment: this.mapAssessment(updated),
      broadcast,
    };
  }

  async getStudentResults(actor: AuthTokenPayload) {
    this.assertStudent(actor);

    const enrollments = await this.prisma.classroomStudent.findMany({
      where: {
        userId: actor.sub,
      },
      select: {
        classroomId: true,
      },
    });

    const classroomIds = enrollments.map((item) => item.classroomId);

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        studentId: actor.sub,
        assessment: {
          classroomId: {
            in: classroomIds,
          },
        },
      },
      include: {
        assessment: {
          include: {
            classroom: true,
            questions: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const attendanceSessions = await this.prisma.attendanceSession.findMany({
      where: {
        classroomId: {
          in: classroomIds,
        },
      },
      include: {
        entries: {
          where: {
            studentId: actor.sub,
          },
        },
        classroom: true,
      },
      orderBy: {
        attendanceDate: 'desc',
      },
    });

    const attendancePresent = attendanceSessions.filter((session) =>
      session.entries.some((entry) => entry.status === AttendanceStatus.present),
    ).length;
    const attendanceAbsent = attendanceSessions.filter((session) =>
      session.entries.some((entry) => entry.status === AttendanceStatus.absent),
    ).length;

    const submittedAttempts = attempts.filter((attempt) => attempt.status === 'submitted');
    const averageScore = submittedAttempts.length
      ? Math.round(
          (submittedAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
            submittedAttempts.length) *
            10,
        ) / 10
      : 0;

    return {
      metrics: {
        attendancePercentage:
          attendanceSessions.length > 0
            ? Math.round((attendancePresent / attendanceSessions.length) * 100)
            : 0,
        attendancePresent,
        attendanceAbsent,
        averageScore,
        scoredCount: submittedAttempts.length,
      },
      attendanceSummary: attendanceSessions.map((session) => ({
        id: session.id,
        attendanceKey: session.attendanceKey,
        attendanceDate: session.attendanceDate,
        classroomId: session.classroomId,
        classroomName: session.classroom.name,
        status: session.entries[0]?.status ?? AttendanceStatus.absent,
      })),
      recentResults: attempts.slice(0, 5).map((attempt) =>
        this.mapAttempt(attempt as unknown as Parameters<typeof this.mapAttempt>[0]),
      ),
      subjectProgress: this.buildSubjectProgress(attempts as unknown as Array<{
        status: string;
        score: number | null;
        totalMarks: number;
        assessment: {
          subject: string;
          chapterTitle: string;
        };
      }>),
      weakTopics: this.buildWeakTopicSummary(attempts as unknown as Array<{
        status: string;
        answers: Array<{
          isCorrect: boolean | null;
          question?: {
            topicTitle: string;
          };
        }>;
      }>),
    };
  }

  async getClassroomAttendance(actor: AuthTokenPayload, classroomId: string) {
    const classroom = await this.getTeacherClassroom(actor, classroomId);
    const attendanceKey = this.currentAttendanceKey();
    const attendanceDate = this.toAttendanceDate(attendanceKey);

    const session = await this.prisma.attendanceSession.findUnique({
      where: {
        classroomId_attendanceKey: {
          classroomId: classroom.id,
          attendanceKey,
        },
      },
      include: {
        entries: true,
      },
    });

    const roster = await this.prisma.classroomStudent.findMany({
      where: {
        classroomId: classroom.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const entryMap = new Map(
      (session?.entries ?? []).map((entry) => [entry.studentId, entry.status]),
    );

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        joinCode: classroom.joinCode,
        subject: classroom.subject,
      },
      attendanceDate,
      attendanceKey,
      session: session
        ? {
            id: session.id,
            attendanceKey: session.attendanceKey,
            attendanceDate: session.attendanceDate,
          }
        : null,
      students: roster.map((student) => ({
        id: student.user.id,
        name: student.user.name,
        handle: student.user.handle,
        rollNumber: student.rollNumber,
        status: entryMap.get(student.user.id) ?? AttendanceStatus.present,
      })),
    };
  }

  async saveClassroomAttendance(
    actor: AuthTokenPayload,
    classroomId: string,
    dto: SaveAttendanceDto,
  ) {
    const classroom = await this.getTeacherClassroom(actor, classroomId);
    const attendanceKey = this.computeAttendanceKey(dto.attendanceDate);
    const attendanceDate = this.toAttendanceDate(attendanceKey);

    const session = await this.prisma.attendanceSession.upsert({
      where: {
        classroomId_attendanceKey: {
          classroomId: classroom.id,
          attendanceKey,
        },
      },
      create: {
        classroomId: classroom.id,
        markedByUserId: actor.sub,
        attendanceKey,
        attendanceDate,
      },
      update: {
        markedByUserId: actor.sub,
        attendanceDate,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const entry of dto.entries) {
        await tx.attendanceEntry.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: session.id,
              studentId: entry.studentId,
            },
          },
          create: {
            attendanceSessionId: session.id,
            studentId: entry.studentId,
            status:
              entry.status === AttendanceStatus.absent
                ? AttendanceStatus.absent
                : AttendanceStatus.present,
          },
          update: {
            status:
              entry.status === AttendanceStatus.absent
                ? AttendanceStatus.absent
                : AttendanceStatus.present,
          },
        });
      }
    });

    return this.getClassroomAttendance(actor, classroomId);
  }

  private buildSubjectProgress(
    attempts: Array<{
      status: string;
      score: number | null;
      totalMarks: number;
      assessment: {
        subject: string;
        chapterTitle: string;
      };
    }>,
  ) {
    const grouped = new Map<
      string,
      {
        subject: string;
        attempts: number;
        score: number;
      }
    >();

    for (const attempt of attempts) {
      if (attempt.status !== 'submitted') {
        continue;
      }

      const subject = attempt.assessment.subject || 'Subject';
      const current = grouped.get(subject) ?? {
        subject,
        attempts: 0,
        score: 0,
      };

      current.attempts += 1;
      current.score += attempt.score ?? 0;
      grouped.set(subject, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      subject: item.subject,
      attempts: item.attempts,
      averageScore: item.attempts ? Math.round((item.score / item.attempts) * 10) / 10 : 0,
    }));
  }

  private buildWeakTopicSummary(
    attempts: Array<{
      status: string;
      answers: Array<{
        isCorrect: boolean | null;
        question?: {
          topicTitle: string;
        };
      }>;
    }>,
  ) {
    const topicStats = new Map<string, number>();

    for (const attempt of attempts) {
      if (attempt.status !== 'submitted') {
        continue;
      }

      for (const answer of attempt.answers) {
        const topic = answer.question?.topicTitle;
        if (!topic || answer.isCorrect !== false) {
          continue;
        }

        topicStats.set(topic, (topicStats.get(topic) ?? 0) + 1);
      }
    }

    return Array.from(topicStats.entries())
      .map(([topic, misses]) => ({ topic, misses }))
      .sort((a, b) => b.misses - a.misses)
      .slice(0, 5);
  }

  private buildQuestionVariant(
    question: {
      id: string;
      topicId?: string | null;
      topicTitle: string;
      type: string;
      prompt: string;
      correctChoiceId: string;
      explanation: string;
      marks?: number;
      options: Array<{ id: string; label: string }>;
    },
    topicId?: string,
  ) {
    const prefix = question.type === 'scenario' ? 'Real-life check' : 'Quick check';
    return {
      ...question,
      topicId: topicId ?? question.topicId ?? null,
      prompt: `${prefix}: ${question.prompt}`,
      explanation: `${question.explanation} This version was regenerated for review.`,
    };
  }

  private async createAuthResponse(userId: string) {
    const user = await this.getUserRecord(userId);
    const token = await this.signToken(user);

    return {
      token,
      user: this.mapUser(user),
    };
  }

  private async getUserRecord(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        membership: true,
        homeOrganization: {
          select: {
            id: true,
            name: true,
            slug: true,
            schoolCode: true,
          },
        },
        teacherClassrooms: {
          include: {
            classroom: {
              include: {
                _count: {
                  select: {
                    studentEnrollments: true,
                    assessments: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        studentClassrooms: {
          include: {
            classroom: {
              include: {
                _count: {
                  select: {
                    assessments: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('This user session is no longer valid.');
    }

    return user as AppUserRecord;
  }

  private async signToken(user: AppUserRecord) {
    const tokenPayload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      handle: user.handle,
      homeOrganizationId: user.homeOrganizationId,
      organizationRole: user.membership?.role ?? null,
      platformRole: user.platformRole,
    };

    return this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET', 'change-me'),
      expiresIn: '7d',
    });
  }

  private mapUser(user: AppUserRecord) {
    const classrooms =
      user.platformRole === PlatformRole.student
        ? user.studentClassrooms.map((item) => ({
            id: item.classroom.id,
            name: item.classroom.name,
            subject: item.classroom.subject,
            joinCode: item.classroom.joinCode,
            rollNumber: item.rollNumber,
          }))
        : user.teacherClassrooms.map((item) => ({
            id: item.classroom.id,
            name: item.classroom.name,
            subject: item.subject,
            joinCode: item.classroom.joinCode,
            studentCount: item.classroom._count?.studentEnrollments ?? 0,
          }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      role: user.platformRole,
      organizationRole: user.membership?.role ?? null,
      organization: user.homeOrganization,
      classrooms,
    };
  }

  private mapAssessment(
    assessment: {
      id: string;
      classroomId: string;
      chapterKey: string;
      chapterTitle: string;
      subject: string;
      difficulty: string;
      totalMarks: number;
      status: AssessmentStatus;
      sourcePdfUrl: string | null;
      videoUrl: string | null;
      topicIds: Prisma.JsonValue;
      questionItems: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
      publishedAt: Date | null;
      resultsSharedAt?: Date | null;
      attemptStatus?: string | null;
      studentScore?: number | null;
      submittedAt?: Date | null;
      classroom?: {
        id: string;
        name: string;
        subject: string | null;
      };
      questions?: Array<AssessmentQuestionRecord>;
    },
    options: { includeQuestions?: boolean } = {},
  ) {
    const questionItems = Array.isArray(assessment.questionItems)
      ? assessment.questionItems
      : [];
    const topicIds = Array.isArray(assessment.topicIds) ? assessment.topicIds : [];
    const questions = (assessment.questions ?? []).map((question) =>
      this.mapAssessmentQuestionRow(question),
    );

    return {
      id: assessment.id,
      classroomId: assessment.classroomId,
      classroomName: assessment.classroom?.name ?? null,
      chapterKey: assessment.chapterKey,
      chapterTitle: assessment.chapterTitle,
      subject: assessment.subject,
      difficulty: assessment.difficulty,
      totalMarks: assessment.totalMarks,
      status: assessment.status,
      sourcePdfUrl: assessment.sourcePdfUrl,
      videoUrl: assessment.videoUrl,
      questionCount: questions.length || questionItems.length,
      topicIds,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      publishedAt: assessment.publishedAt,
      resultsSharedAt: assessment.resultsSharedAt ?? null,
      attemptStatus: assessment.attemptStatus ?? null,
      studentScore: assessment.studentScore ?? null,
      submittedAt: assessment.submittedAt ?? null,
      questions: options.includeQuestions
        ? questions.length > 0
          ? questions
          : questionItems
        : undefined,
    };
  }

  private buildQuestionItems(selectedTopics: SyllabusTopic[]) {
    return selectedTopics.flatMap((topic) => [
      this.mapQuestion(topic, topic.quiz),
      this.mapQuestion(topic, topic.scenario),
    ]);
  }

  private mapQuestion(topic: SyllabusTopic, question: SyllabusQuestion) {
    return {
      topicId: topic.id,
      id: question.id,
      topicTitle: topic.title,
      type: question.type,
      prompt: question.prompt,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
      options: question.options,
    };
  }

  private async requireChapter(chapterKey: string): Promise<ChapterSyllabus> {
    const chapter = await this.loadLessonByChapterKey(chapterKey);

    if (!chapter) {
      throw new NotFoundException('No syllabus pack was found for this chapter.');
    }

    return chapter;
  }

  private async getTeacherClassroom(actor: AuthTokenPayload, classroomId: string) {
    const classroom = await this.getAccessibleClassroom(actor, classroomId);
    const canManage =
      classroom.teacherAssignments.some(
        (assignment) => assignment.userId === actor.sub,
      ) ||
      actor.organizationRole === OrganizationRole.org_admin ||
      actor.platformRole === PlatformRole.platform_admin;

    if (!canManage) {
      throw new ForbiddenException('You do not have access to this classroom.');
    }

    return classroom;
  }

  private assertTeacher(actor: AuthTokenPayload) {
    if (
      actor.platformRole !== PlatformRole.teacher &&
      actor.platformRole !== PlatformRole.platform_admin
    ) {
      throw new ForbiddenException('Teacher access is required.');
    }
  }

  private assertStudent(actor: AuthTokenPayload) {
    if (actor.platformRole !== PlatformRole.student) {
      throw new ForbiddenException('Student access is required.');
    }
  }

  private normalizeCode(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, '');
  }

  private async resolveAvailableHandle(baseHandle: string) {
    let candidate = baseHandle;
    let suffix = 1;

    while (
      await this.prisma.user.findUnique({
        where: { handle: candidate },
        select: { id: true },
      })
    ) {
      candidate = `${baseHandle}${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async resolveAvailableOrganizationSlug(name: string) {
    const baseSlug = slugify(name) || `school-${Date.now()}`;
    let candidate = baseSlug;
    let suffix = 1;

    while (
      await this.prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async resolveAvailableClassroomCode(classroomName: string) {
    const normalized = slugify(classroomName).replace(/-/g, '').toUpperCase();
    const base = (normalized.slice(0, 4) || 'CLSS').padEnd(4, 'X');
    let candidate = `${base}${Math.floor(100 + Math.random() * 900)}`;

    while (
      await this.prisma.classroom.findUnique({
        where: { joinCode: candidate },
        select: { id: true },
      })
    ) {
      candidate = `${base}${Math.floor(100 + Math.random() * 900)}`;
    }

    return candidate;
  }

  private async resolveAvailableGroupSlug(
    prisma: Prisma.TransactionClient | PrismaService,
    organizationId: string,
    name: string,
  ) {
    const baseSlug = slugify(name) || 'school-notices';
    let candidate = baseSlug;
    let suffix = 1;

    while (
      await prisma.group.findFirst({
        where: {
          ownerOrganizationId: organizationId,
          slug: candidate,
        },
        select: { id: true },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
