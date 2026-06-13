from typing import Optional, List
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.business.training import TrainingBusiness
import io


class CreateCourseRequest(BaseModel):
    title: str
    description: str = ''
    instructor: str = ''
    datetime: str
    location: str = ''
    link: str = ''
    capacity: int = 0
    departments: list


class UpdateCourseRequest(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    datetime: Optional[str] = None
    location: Optional[str] = None
    link: Optional[str] = None
    capacity: Optional[int] = None
    departments: Optional[list] = None
    status: Optional[str] = None


class ConfirmRequest(BaseModel):
    enrollment_id: int


class LeaveRequest(BaseModel):
    enrollment_id: int
    reason: str


class LeaveActionRequest(BaseModel):
    leave_id: int


class CheckInRequest(BaseModel):
    enrollment_id: int


class SaveQuizRequest(BaseModel):
    course_id: int
    questions: list


class SubmitQuizRequest(BaseModel):
    enrollment_id: int
    answers: list


class CreateEmployeeRequest(BaseModel):
    employee_id: str
    name: str
    department: str
    role: str = 'employee'


class LoginRequest(BaseModel):
    employee_id: str
    password: str


class TrainingController:
    def __init__(self):
        self.business = TrainingBusiness()

    def ActionTrainingLoginPost(self, request: Request, body: LoginRequest):
        return self.business.login(body.employee_id, body.password)

    def ActionTrainingInitdemoGet(self, request: Request):
        return self.business.init_demo_data()

    def ActionTrainingEmployeesGet(self, request: Request):
        return self.business.get_employees()

    def ActionTrainingDepartmentsGet(self, request: Request):
        return self.business.get_departments()

    def ActionTrainingEmployeeGet(self, request: Request, id: int = Query(..., ge=1)):
        return self.business.get_employee_by_id(id)

    def ActionTrainingEmployeePost(self, request: Request, body: CreateEmployeeRequest):
        return self.business.create_employee(body.employee_id, body.name, body.department, body.role)

    def ActionTrainingCoursesGet(self, request: Request, status: Optional[str] = Query(None)):
        return self.business.get_courses(status)

    def ActionTrainingCourseGet(self, request: Request, id: int = Query(..., ge=1)):
        return self.business.get_course(id)

    def ActionTrainingCoursePost(self, request: Request, body: CreateCourseRequest):
        return self.business.create_course(
            title=body.title,
            description=body.description,
            instructor=body.instructor,
            datetime_str=body.datetime,
            location=body.location,
            link=body.link,
            capacity=body.capacity,
            departments=body.departments
        )

    def ActionTrainingCoursePut(self, request: Request, body: UpdateCourseRequest):
        kwargs = {}
        if body.title is not None:
            kwargs['title'] = body.title
        if body.description is not None:
            kwargs['description'] = body.description
        if body.instructor is not None:
            kwargs['instructor'] = body.instructor
        if body.datetime is not None:
            kwargs['datetime_str'] = body.datetime
        if body.location is not None:
            kwargs['location'] = body.location
        if body.link is not None:
            kwargs['link'] = body.link
        if body.capacity is not None:
            kwargs['capacity'] = body.capacity
        if body.departments is not None:
            kwargs['departments'] = body.departments
        if body.status is not None:
            kwargs['status'] = body.status
        return self.business.update_course(body.id, **kwargs)

    def ActionTrainingCourseDelete(self, request: Request, id: int = Query(..., ge=1)):
        return self.business.delete_course(id)

    def ActionTrainingEmployeecoursesGet(self, request: Request, employee_id: int = Query(..., ge=1)):
        return self.business.get_employee_courses(employee_id)

    def ActionTrainingConfirmenrollmentPost(self, request: Request, body: ConfirmRequest):
        return self.business.confirm_attendance(body.enrollment_id)

    def ActionTrainingRequestleavePost(self, request: Request, body: LeaveRequest):
        return self.business.request_leave(body.enrollment_id, body.reason)

    def ActionTrainingLeaverequestsGet(self, request: Request, status: Optional[str] = Query(None)):
        return self.business.get_leave_requests(status)

    def ActionTrainingApproveleavePost(self, request: Request, body: LeaveActionRequest):
        return self.business.approve_leave(body.leave_id)

    def ActionTrainingRejectleavePost(self, request: Request, body: LeaveActionRequest):
        return self.business.reject_leave(body.leave_id)

    def ActionTrainingCheckinPost(self, request: Request, body: CheckInRequest):
        return self.business.check_in(body.enrollment_id)

    def ActionTrainingCourseattendanceGet(self, request: Request, id: int = Query(..., ge=1)):
        return self.business.get_course_attendance(id)

    def ActionTrainingQuizGet(self, request: Request, course_id: int = Query(..., ge=1)):
        return self.business.get_quiz(course_id)

    def ActionTrainingEmployeequizGet(self, request: Request, course_id: int = Query(..., ge=1), employee_id: int = Query(..., ge=1)):
        return self.business.get_quiz_for_employee(course_id, employee_id)

    def ActionTrainingQuizPost(self, request: Request, body: SaveQuizRequest):
        return self.business.save_quiz(body.course_id, body.questions)

    def ActionTrainingSubmitquizPost(self, request: Request, body: SubmitQuizRequest):
        return self.business.submit_quiz(body.enrollment_id, body.answers)

    def ActionTrainingEmployeeprofileGet(self, request: Request, employee_id: int = Query(..., ge=1)):
        return self.business.get_employee_profile(employee_id)

    def ActionTrainingStatisticsGet(self, request: Request):
        return self.business.get_statistics()

    def ActionTrainingCertificateGet(self, request: Request, employee_id: int = Query(..., ge=1), course_id: int = Query(..., ge=1)):
        from fastapi.responses import HTMLResponse
        html = self.business.generate_certificate_html(employee_id, course_id)
        return HTMLResponse(content=html)

    def ActionTrainingExportcertificateGet(self, request: Request, employee_id: int = Query(..., ge=1), course_id: int = Query(..., ge=1)):
        from fastapi.responses import HTMLResponse
        html = self.business.generate_certificate_html(employee_id, course_id)
        try:
            from weasyprint import HTML
            pdf_bytes = HTML(string=html).write_pdf()
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type='application/pdf',
                headers={
                    'Content-Disposition': f'attachment; filename="training_certificate_{employee_id}_{course_id}.pdf"'
                }
            )
        except Exception as e:
            print(f'[WARN] weasyprint not available, using HTML fallback: {type(e).__name__}')
            print(f'       Tip: on macOS run: brew install pango gdk-pixbuf cairo')
            html_with_fallback = html + '''
<script>
window.onload = function() {
    const btn = document.createElement('div');
    btn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:12px 24px;background:#2c5282;color:#fff;border-radius:8px;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    btn.innerHTML = '🖨️ 打印/导出PDF (Ctrl+P / Cmd+P)';
    btn.onclick = function() { window.print(); };
    const tip = document.createElement('div');
    tip.style.cssText = 'position:fixed;top:72px;right:20px;z-index:9999;padding:10px 16px;background:#fff3cd;color:#856404;border-radius:6px;font-size:12px;border:1px solid #ffeaa7;max-width:320px;';
    tip.innerHTML = '💡 建议：点击打印后选择「另存为PDF」即可导出PDF文件';
    document.body.appendChild(btn);
    document.body.appendChild(tip);
};
</script>'''
            return HTMLResponse(content=html_with_fallback)
