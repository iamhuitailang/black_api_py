from typing import Optional
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.business.contacts import ContactBusiness


class ParentSubmitRequest(BaseModel):
    student_name: str
    class_name: str
    parent_name: str
    relation: str
    phone: str
    address: Optional[str] = None


class ParentUpdateRequest(BaseModel):
    phone: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    parent_name: Optional[str] = None
    relation: Optional[str] = None
    new_phone: Optional[str] = None
    address: Optional[str] = None


class TeacherUpdateContactRequest(BaseModel):
    contact_id: int
    is_emergency: Optional[int] = None
    note: Optional[str] = None


class ContactController:
    def __init__(self):
        self.business = ContactBusiness()

    def ActionContactParentSubmitPost(self, request: Request, body: ParentSubmitRequest):
        """
        家长提交登记信息
        POST /api/contact/parent/submit
        """
        return self.business.parent_submit(
            body.student_name, body.class_name, body.parent_name,
            body.relation, body.phone, body.address
        )

    def ActionContactParentModifyPut(self, request: Request, body: ParentUpdateRequest):
        """
        家长修改信息（按手机号验证）
        PUT /api/contact/parent/modify/put
        """
        return self.business.parent_update(
            body.phone, body.student_name, body.class_name,
            body.parent_name, body.relation, body.new_phone, body.address
        )

    def ActionContactParentQueryGet(self, request: Request, phone: str = Query(..., min_length=1)):
        """
        家长查询自己的登记信息（按手机号）
        GET /api/contact/parent/query/get
        """
        return self.business.parent_get_by_phone(phone)

    def ActionContactTeacherStudentsGet(self, request: Request,
                                        keyword: Optional[str] = Query(None),
                                        class_name: Optional[str] = Query(None),
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(100, ge=1, le=500)):
        """
        教师查询学生列表（支持姓名模糊搜索和班级筛选）
        GET /api/contact/teacher/students/get
        """
        return self.business.teacher_get_students(keyword, class_name, page, page_size)

    def ActionContactTeacherStudentcontactsGet(self, request: Request,
                                         student_id: int = Query(..., ge=1)):
        """
        教师查询某学生的所有家长联系人
        GET /api/contact/teacher/studentcontacts/get
        """
        return self.business.teacher_get_contacts_by_student(student_id)

    def ActionContactTeacherUpdatecontactPut(self, request: Request,
                                           body: TeacherUpdateContactRequest):
        """
        教师修改联系人：紧急联系人标记、备注
        PUT /api/contact/teacher/updatecontact/put
        """
        return self.business.teacher_update_contact(
            body.contact_id, body.is_emergency, body.note
        )

    def ActionContactTeacherAllcontactsGet(self, request: Request,
                                            keyword: Optional[str] = Query(None),
                                            class_name: Optional[str] = Query(None)):
        """
        教师查询所有联系人明细（支持搜索和班级筛选）
        GET /api/contact/teacher/allcontacts/get
        """
        return self.business.teacher_get_all_contacts(keyword, class_name)

    def ActionContactTeacherClassesGet(self, request: Request):
        """
        教师获取所有班级列表
        GET /api/contact/teacher/classes/get
        """
        return self.business.teacher_get_classes()

    def ActionContactTeacherExportcsvGet(self, request: Request,
                                       keyword: Optional[str] = Query(None),
                                       class_name: Optional[str] = Query(None)):
        """
        教师导出联系人CSV文件
        GET /api/contact/teacher/exportcsv/get
        """
        csv_content, filename = self.business.export_csv(keyword, class_name)
        import io
        from urllib.parse import quote
        safe_filename = quote(filename)
        return StreamingResponse(
            io.BytesIO('\ufeff'.encode('utf-8') + csv_content.encode('utf-8-sig')),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}; filename=\"contacts.csv\""
            }
        )
