import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterTeacherDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  schoolName!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  schoolCode!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  classroomName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  subject!: string;
}

export class RegisterStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  schoolCode!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  classroomCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  rollNumber?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password!: string;
}

export class GenerateAssessmentDto {
  @IsString()
  classroomId!: string;

  @IsOptional()
  @IsString()
  classroomSubjectId?: string;

  @IsString()
  chapterKey!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  topicIds!: string[];

  @IsInt()
  @Min(1)
  totalMarks!: number;

  @IsString()
  @IsIn(['Easy', 'Balanced', 'Challenging'])
  difficulty!: string;
}

export class CreateClassroomSubjectDto {
  @IsString()
  classroomId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  teacherUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  themeColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  iconKey?: string;
}

export class CreateChapterDto {
  @IsString()
  classroomSubjectId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  chapterKey!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(8)
  summary!: string;

  @IsOptional()
  @IsString()
  sourcePdfUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class ManualQuestionDto {
  @IsString()
  @MinLength(2)
  topicTitle!: string;

  @IsString()
  @MinLength(5)
  prompt!: string;

  @IsString()
  @MinLength(1)
  correctChoiceId!: string;

  @IsString()
  @MinLength(3)
  explanation!: string;

  @IsArray()
  @ArrayMinSize(2)
  options!: Array<{
    id: string;
    label: string;
  }>;

  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;
}

export class RegenerateQuestionDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsString()
  topicId?: string;
}

export class SaveAttemptAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsString()
  selectedChoiceId?: string;
}

export class AttendanceEntryDto {
  @IsString()
  studentId!: string;

  @IsString()
  @IsIn(['present', 'absent'])
  status!: string;
}

export class SaveAttendanceDto {
  @IsString()
  attendanceDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  entries!: AttendanceEntryDto[];
}

export class ShareAssessmentResultsDto {
  @IsOptional()
  @IsString()
  groupId?: string;
}
