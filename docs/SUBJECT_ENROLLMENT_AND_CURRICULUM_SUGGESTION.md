# Subject Enrollment & Curriculum Alignment – Suggestion

This document suggests how to move from **“subjects assigned to class”** to **“subjects enrolled per student, aligned to curriculum”**, with **required vs optional** subjects and **retake/irregular** logic.

---

## 1. Current vs Desired

### Current (simplified)

- **Enrollment**: Student enrolls in a **class** (section) for an academic year/semester.
- **ClassSubject**: Class has subjects (ClassSubject = class + subject + teacher + term). All students in the class are implicitly “in” those subjects.
- **Grades/Attendance**: Stored per **student** and **class_subject** (so already per-student, but enrollment is at class level).
- **Curriculum**: `course_year_subjects` already defines which subjects belong to which course/year/semester and has **is_required** (required vs elective).

### Desired

- **Subjects are enrolled per student**, not per class. A student’s load is “these subjects this term,” not “whatever my class has.”
- **Curriculum** (CourseYearSubject) drives what subjects a student *can* take and whether each is **required** or **optional**.
- **Retake**: Only the student who failed retakes the subject; the whole class is not tied to that.
- **Required vs optional**:
  - **Required + failed** → student is **irregular**; cannot enroll in “next” curriculum subjects until they **pass** this specific subject (retake).
  - **Optional + failed** → student can still be **regular** and enroll in next subjects; may retake the elective later.

---

## 2. Keep / Reuse

- **CourseYearSubject (curriculum)**  
  - Already: `course_id`, `year_level`, `subject_id`, `semester`, **`is_required`**, `units`, etc.  
  - Use this as the single source of “what subjects exist in the curriculum” and “required vs optional.”

- **Class & ClassSubject**  
  - Keep as **sections/schedules**: “This class (section) offers this subject this term with this teacher.”  
  - Use for: scheduling, attendance (which section the student attends), and optionally linking a student’s subject enrollment to a specific section.

- **Grade**  
  - Keep **per student, per class_subject** (or per student_subject_enrollment if you introduce it).  
  - Add or use **remarks** (Passed/Failed/Incomplete) and link to curriculum’s **is_required** for irregular/regular logic.

---

## 3. New / Changed Pieces

### 3.1 Student–Subject Enrollment (core change)

Introduce a **student-level subject enrollment** so that “subjects” are enrolled **per student**, not only via class.

**Option A – New table: `student_subject_enrollments`**

| Column                 | Type / Notes |
|------------------------|-------------|
| id                     | PK          |
| student_id             | FK students |
| course_year_subject_id| FK course_year_subjects (curriculum) |
| class_subject_id       | FK, nullable – which section they attend (if any) |
| academic_year_id       | FK          |
| semester_id            | FK          |
| status                 | enum: enrolled, passed, failed, dropped, incomplete |
| is_retake              | boolean – true if retaking after fail |
| enrolled_at            | timestamp   |
| completed_at           | nullable timestamp (when final grade/status set) |

- **course_year_subject_id** ties the enrollment to the curriculum (and thus to **is_required**).
- **class_subject_id** optional: which section/schedule they’re in for that subject (for attendance, room, schedule).
- When a grade is finalized, update `status` (passed/failed) and set `completed_at`; if they failed and retake later, create a new row with `is_retake = true`.

**Option B – Reuse/expand existing**

- If you prefer not to add a new table immediately, you could:
  - Keep grades per **student + class_subject**.
  - Add a **concept** of “student is enrolled in this subject this term” by:
    - Either: ensuring every grade row implies “enrolled in that class_subject,” and adding a `course_year_subject_id` (or curriculum link) on **Grade** or **ClassSubject**.
    - Or: treating “has a grade row for this class_subject” as enrollment, and deriving “required vs optional” from CourseYearSubject by matching course/year/semester/subject.
- Long term, Option A is clearer for “student enrolled in subject X (from curriculum), possibly in section Y.”

### 3.2 Link curriculum to class offerings (ClassSubject)

So that we know “this ClassSubject is for which curriculum row”:

- Add **course_year_subject_id** (nullable) to **class_subjects**.
- When creating a ClassSubject (class + subject + term), optionally set which curriculum line it satisfies.  
- Then: required vs optional and “next” subjects come from CourseYearSubject; section assignment is ClassSubject.

### 3.3 Required vs optional (already in curriculum)

- **CourseYearSubject.is_required**:
  - **true** = required; if student **fails** → irregular, cannot progress until they pass this subject (retake).
  - **false** = optional/elective; if student fails → can still be regular and enroll in next subjects; may retake later.

No new field is strictly necessary; use this flag everywhere in enrollment and progression logic.

### 3.4 “Irregular” and “can enroll in next subject”

- **Irregular**:  
  - Define as: “student has at least one **required** subject in the curriculum with status **failed** (or incomplete) that they have not yet passed (no later passed enrollment for that curriculum subject).”
- **Can enroll in next subject** (e.g. next semester or next year level):
  - **Required subject**: Allow only if:
    - either the student has no failed required subject that is a prerequisite (or that blocks progression by your rule),  
    - or you explicitly allow “retake in same term” and they are enrolling in that same subject as retake.
  - **Optional subject**: Failing an optional subject does **not** block enrolling in other subjects.

You can implement “next” by:
- **Simple**: same course, same year_level, next semester; or same course, next year_level.  
- **Strict**: add optional **prerequisite** (e.g. “Subject B requires Subject A passed”) in curriculum later.

### 3.5 Retake flow

- Student fails subject → grade remarks = Failed; student_subject_enrollment status = failed (if you use that table).
- For **required** subject:
  - Student is irregular until they pass.
  - They enroll again in the **same** curriculum subject (same course_year_subject_id) in a later term → create new enrollment with **is_retake = true**, attach to a ClassSubject (section) that offers it.
- For **optional** subject:
  - Student can enroll in next subjects normally; optionally retake the elective later with is_retake = true.

---

## 4. Implementation order (suggested)

1. **Curriculum as source of truth**
   - Ensure **CourseYearSubject** is complete (all subjects per course/year/semester, **is_required** set correctly).
   - Expose “required vs optional” in admin/UI (you may already have this).

2. **Student–subject enrollment**
   - Add **student_subject_enrollments** (or equivalent) and migrations.
   - When a student “enrolls in subjects” for a term, create one row per subject (linked to course_year_subject_id and optionally class_subject_id).
   - Enforce “allowed subjects” from curriculum (course + year_level + semester) and from “no blocking failed required” rule.

3. **Class / ClassSubject role**
   - Keep ClassSubject as “section offering.” Optionally add **course_year_subject_id** to ClassSubject.
   - When assigning a student to a section for a subject, set **class_subject_id** on their student_subject_enrollment (and keep using ClassSubject for attendance/grades if you keep grades on class_subject).

4. **Grades**
   - Keep grades as student + class_subject (or student + student_subject_enrollment if you prefer). When final grade is saved, set remarks (Passed/Failed/Incomplete) and update the corresponding student_subject_enrollment status (and completed_at).

5. **Irregular / progression rules**
   - Implement “has failed required and not yet passed” → irregular.
   - In enrollment UI/API: when adding “next” subjects, hide or block subjects that require a failed required subject to be passed first (or allow only the retake of that subject).

6. **UI**
   - **Enrollment by student**: “Enroll student in subjects” for a term: list allowed subjects from curriculum + “no blocking failed required”; student picks or admin assigns; create student_subject_enrollments and optionally assign sections (class_subject_id).
   - **Class/section**: “This class offers these subjects” (ClassSubject) for scheduling; students enrolled in those subjects can be assigned to this section.
   - Show **required vs optional** and **irregular** status clearly (e.g. badges, filters).

---

## 5. Summary

- **Subjects enrolled per student**: add **student_subject_enrollments** (or equivalent) linked to **course_year_subjects** (curriculum).
- **Curriculum**: already has **is_required**. Use it to decide:
  - **Required + failed** → irregular; block “next” subjects until this one is passed (retake).
  - **Optional + failed** → still regular; can enroll in next subjects; retake optional later.
- **Class/ClassSubject**: keep as sections/schedules; optionally link to curriculum via **course_year_subject_id**; use for attendance and which section a student attends.
- **Retake**: only the student retakes the subject (new enrollment row with is_retake); not the whole class.

---

## 6. Implementation status (done)

The following has been implemented:

- **Migration** `2026_01_30_000001_create_student_subject_enrollments_table.php`: table `student_subject_enrollments` with `student_id`, `course_year_subject_id`, `academic_year_id`, `semester_id`, `class_subject_id` (nullable), `status`, `is_retake`, `enrolled_at`, `completed_at`, `remarks`.
- **Migration** `2026_01_30_000002_add_course_year_subject_id_to_class_subjects_table.php`: optional `course_year_subject_id` on `class_subjects` to link a section offering to curriculum.
- **Model** `App\Models\StudentSubjectEnrollment`: relationships, scopes (byStudent, byTerm, byStatus, byClassSubjectAndTerm), `markCompleted()`, `studentIsIrregular()`.
- **Relationships**: `Student` → `studentSubjectEnrollments()` and `isIrregular()`; `ClassSubject` → `course_year_subject_id`, `courseYearSubject()`, `studentSubjectEnrollments()`; `CourseYearSubject` → `studentSubjectEnrollments()`.
- **Grade sync**: When a grade’s final rating/remarks is set (`Grade::updateFinalRating()`), the matching `StudentSubjectEnrollment` (by student, class_subject, term) is updated to status passed/failed/incomplete.
- **API** `StudentSubjectEnrollmentController`:
  - `GET /api/student-subject-enrollments` – list with filters (student_id, academic_year_id, semester_id, class_id, status, search).
  - `GET /api/student-subject-enrollments/available-subjects?student_id=&academic_year_id=&semester_id=` – curriculum subjects the student can enroll in (respects already enrolled and failed-required block; allows retake of failed required).
  - `POST /api/student-subject-enrollments` – enroll student in subjects (body: student_id, academic_year_id, semester_id, course_year_subject_ids[], optional class_subject_ids[]).
  - `PUT /api/student-subject-enrollments/{id}` – update status or class_subject_id.
  - `GET /api/student-subject-enrollments/students/{studentId}/irregular-status` – returns `is_irregular`.

**Next steps for you:** Run `php artisan migrate` (after `composer install` if needed). Then add an admin UI to “Enroll student in subjects” (call available-subjects and store), and optionally show irregular status on student/profile or enrollment screens.

If you want to proceed further, the next concrete step is: add the **student_subject_enrollments** migration and a **StudentSubjectEnrollment** model, then implement “enroll student in subjects for this term” using curriculum and required/optional + irregular rules above.
