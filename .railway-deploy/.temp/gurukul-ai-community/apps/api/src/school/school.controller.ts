import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthTokenPayload } from '../auth/auth.types';
import { SchoolService } from './school.service';
import {
  AttendanceEntryDto,
  CreateChapterDto,
  CreateClassroomSubjectDto,
  GenerateAssessmentDto,
  LoginDto,
  RegisterStudentDto,
  RegisterTeacherDto,
  ManualQuestionDto,
  RegenerateQuestionDto,
  SaveAttemptAnswerDto,
  SaveAttendanceDto,
  ShareAssessmentResultsDto,
} from './dto/school.dto';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post('auth/register-teacher')
  registerTeacher(@Body() dto: RegisterTeacherDto) {
    return this.schoolService.registerTeacher(dto);
  }

  @Post('auth/register-student')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.schoolService.registerStudent(dto);
  }

  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.schoolService.login(dto);
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.getMe(actor);
  }

  @Get('dashboard/teacher')
  @UseGuards(JwtAuthGuard)
  teacherDashboard(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.getTeacherDashboard(actor);
  }

  @Get('dashboard/student')
  @UseGuards(JwtAuthGuard)
  studentDashboard(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.getStudentDashboard(actor);
  }

  @Get('classrooms/teacher')
  @UseGuards(JwtAuthGuard)
  teacherClassrooms(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.getTeacherClassrooms(actor);
  }

  @Get('classrooms/:classroomId/subjects')
  @UseGuards(JwtAuthGuard)
  classroomSubjects(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('classroomId') classroomId: string,
  ) {
    return this.schoolService.listClassroomSubjects(actor, classroomId);
  }

  @Post('classrooms/:classroomId/subjects')
  @UseGuards(JwtAuthGuard)
  createClassroomSubject(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('classroomId') classroomId: string,
    @Body() dto: CreateClassroomSubjectDto,
  ) {
    return this.schoolService.createClassroomSubject(actor, classroomId, dto);
  }

  @Get('subjects/:subjectId/chapters')
  @UseGuards(JwtAuthGuard)
  subjectChapters(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('subjectId') subjectId: string,
  ) {
    return this.schoolService.listSubjectChapters(actor, subjectId);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard)
  createChapter(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() dto: CreateChapterDto,
  ) {
    return this.schoolService.createChapter(actor, dto);
  }

  @Get('lessons/:chapterKey')
  @UseGuards(JwtAuthGuard)
  getLesson(@Param('chapterKey') chapterKey: string) {
    return this.schoolService.getLesson(chapterKey);
  }

  @Get('assessments/teacher')
  @UseGuards(JwtAuthGuard)
  teacherAssessments(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.listTeacherAssessments(actor);
  }

  @Get('assessments/student')
  @UseGuards(JwtAuthGuard)
  studentAssessments(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.listStudentAssessments(actor);
  }

  @Get('assessments/:assessmentId')
  @UseGuards(JwtAuthGuard)
  getAssessment(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.schoolService.getAssessment(actor, assessmentId);
  }

  @Post('assessments/drafts')
  @UseGuards(JwtAuthGuard)
  generateDraft(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() dto: GenerateAssessmentDto,
  ) {
    return this.schoolService.generateDraftAssessment(actor, dto);
  }

  @Post('assessments/:assessmentId/publish')
  @UseGuards(JwtAuthGuard)
  publishAssessment(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.schoolService.publishAssessment(actor, assessmentId);
  }

  @Post('assessments/:assessmentId/questions/regenerate')
  @UseGuards(JwtAuthGuard)
  regenerateQuestion(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: RegenerateQuestionDto,
  ) {
    return this.schoolService.regenerateAssessmentQuestion(actor, assessmentId, dto);
  }

  @Post('assessments/:assessmentId/questions/manual')
  @UseGuards(JwtAuthGuard)
  addManualQuestion(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: ManualQuestionDto,
  ) {
    return this.schoolService.addManualQuestion(actor, assessmentId, dto);
  }

  @Post('assessments/:assessmentId/attempts')
  @UseGuards(JwtAuthGuard)
  startAttempt(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.schoolService.startAttempt(actor, assessmentId);
  }

  @Patch('attempts/:attemptId/answers')
  @UseGuards(JwtAuthGuard)
  saveAttemptAnswer(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveAttemptAnswerDto,
  ) {
    return this.schoolService.saveAttemptAnswer(actor, attemptId, dto);
  }

  @Post('attempts/:attemptId/submit')
  @UseGuards(JwtAuthGuard)
  submitAttempt(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('attemptId') attemptId: string,
  ) {
    return this.schoolService.submitAttempt(actor, attemptId);
  }

  @Get('assessments/:assessmentId/results')
  @UseGuards(JwtAuthGuard)
  assessmentResults(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.schoolService.listAssessmentResults(actor, assessmentId);
  }

  @Post('assessments/:assessmentId/share-results')
  @UseGuards(JwtAuthGuard)
  shareAssessmentResults(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: ShareAssessmentResultsDto,
  ) {
    return this.schoolService.shareAssessmentResults(actor, assessmentId, dto);
  }

  @Get('students/me/results')
  @UseGuards(JwtAuthGuard)
  myResults(@CurrentUser() actor: AuthTokenPayload) {
    return this.schoolService.getStudentResults(actor);
  }

  @Get('attendance/classrooms/:classroomId')
  @UseGuards(JwtAuthGuard)
  classroomAttendance(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('classroomId') classroomId: string,
  ) {
    return this.schoolService.getClassroomAttendance(actor, classroomId);
  }

  @Post('attendance/classrooms/:classroomId')
  @UseGuards(JwtAuthGuard)
  saveClassroomAttendance(
    @CurrentUser() actor: AuthTokenPayload,
    @Param('classroomId') classroomId: string,
    @Body() dto: SaveAttendanceDto,
  ) {
    return this.schoolService.saveClassroomAttendance(actor, classroomId, dto);
  }
}
