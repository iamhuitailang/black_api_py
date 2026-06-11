import csv
import io
from typing import Optional, Dict, Any, List
from app.model.contacts import StudentModel, ContactModel


class ContactBusiness:
    def __init__(self):
        self.student_model = StudentModel()
        self.contact_model = ContactModel()

    def _success(self, data: Any = None, message: str = "success") -> Dict[str, Any]:
        return {"code": 0, "message": message, "data": data}

    def _error(self, message: str, code: int = 400, data: Any = None) -> Dict[str, Any]:
        return {"code": code, "message": message, "data": data}

    def parent_submit(self, student_name: str, class_name: str, parent_name: str,
                      relation: str, phone: str, address: str = None) -> Dict[str, Any]:
        if not all([student_name, class_name, parent_name, relation, phone]):
            return self._error("请填写必填项")

        phone = phone.strip()
        student_name = student_name.strip()
        class_name = class_name.strip()

        student = self.student_model.get_by_name_and_class(student_name, class_name)
        if not student:
            student_id = self.student_model.create(student_name, class_name)
        else:
            student_id = student['id']

        existing = self.contact_model.get_by_student_and_phone(student_id, phone)
        if existing:
            return self._error("该学生已使用此手机号登记过，如需修改请使用修改功能")

        contact_id = self.contact_model.create(
            student_id=student_id,
            parent_name=parent_name.strip(),
            relation=relation.strip(),
            phone=phone,
            address=address.strip() if address else None
        )
        return self._success({"contact_id": contact_id, "student_id": student_id}, "信息提交成功")

    def parent_update(self, phone: str, contact_id: int = None,
                      student_name: str = None, class_name: str = None,
                      parent_name: str = None, relation: str = None,
                      new_phone: str = None, address: str = None) -> Dict[str, Any]:
        if not phone:
            return self._error("请输入手机号验证身份")

        phone = phone.strip()
        all_contacts = self.contact_model.get_all_by_phone_with_student(phone)
        if not all_contacts:
            return self._error("未找到该手机号的登记信息")

        target_contact = None
        if contact_id:
            for c in all_contacts:
                if c['id'] == contact_id:
                    target_contact = c
                    break
            if not target_contact:
                return self._error("未找到该联系人记录")
        else:
            if len(all_contacts) > 1:
                return self._error("该手机号绑定了多个孩子，请选择要修改的记录", 300, {"contacts": all_contacts})
            target_contact = all_contacts[0]

        student = self.student_model.get_by_id(target_contact['student_id'])

        update_data = {}
        if parent_name is not None:
            update_data['parent_name'] = parent_name.strip()
        if relation is not None:
            update_data['relation'] = relation.strip()
        if new_phone is not None and new_phone.strip() != phone:
            update_data['phone'] = new_phone.strip()
        if address is not None:
            update_data['address'] = address.strip() if address.strip() else None

        student_update_data = {}
        if student_name is not None and student_name.strip():
            student_update_data['name'] = student_name.strip()
        if class_name is not None and class_name.strip():
            student_update_data['class_name'] = class_name.strip()

        if student_update_data and student:
            existing_student = self.student_model.get_by_name_and_class(
                student_update_data.get('name', student['name']),
                student_update_data.get('class_name', student['class_name'])
            )
            if existing_student and existing_student['id'] != student['id']:
                update_data['student_id'] = existing_student['id']
            else:
                self.student_model.update(student['id'], **student_update_data)

        if update_data:
            self.contact_model.update(target_contact['id'], **update_data)

        return self._success(None, "信息更新成功")

    def parent_get_by_phone(self, phone: str) -> Dict[str, Any]:
        if not phone:
            return self._error("请输入手机号")
        results = self.contact_model.get_all_by_phone_with_student(phone.strip())
        if not results:
            return self._error("未找到该手机号的登记信息", 404)
        return self._success(results)

    def teacher_get_students(self, keyword: str = None, class_name: str = None,
                             page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        result = self.student_model.search(keyword, class_name, page, page_size)
        return self._success(result)

    def teacher_get_contacts_by_student(self, student_id: int) -> Dict[str, Any]:
        student = self.student_model.get_by_id(student_id)
        if not student:
            return self._error("学生不存在", 404)
        contacts = self.contact_model.get_by_student_id(student_id)
        return self._success({
            "student": student,
            "contacts": contacts
        })

    def teacher_update_contact(self, contact_id: int, is_emergency: int = None,
                               note: str = None) -> Dict[str, Any]:
        contact = self.contact_model.get_by_id(contact_id)
        if not contact:
            return self._error("联系人不存在", 404)
        update_data = {}
        if is_emergency is not None:
            update_data['is_emergency'] = 1 if is_emergency else 0
        if note is not None:
            update_data['note'] = note
        if update_data:
            self.contact_model.update(contact_id, **update_data)
        return self._success(None, "更新成功")

    def teacher_get_all_contacts(self, keyword: str = None, class_name: str = None) -> Dict[str, Any]:
        result = self.contact_model.get_all_with_student(keyword, class_name)
        return self._success(result)

    def teacher_get_classes(self) -> Dict[str, Any]:
        classes = self.student_model.get_all_classes()
        return self._success(classes)

    def export_csv(self, keyword: str = None, class_name: str = None) -> tuple[str, str]:
        contacts = self.contact_model.get_all_with_student(keyword, class_name)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            '序号', '班级', '学生姓名', '家长姓名', '关系',
            '手机号', '家庭住址', '是否紧急联系人', '家访备注'
        ])
        for idx, c in enumerate(contacts, 1):
            writer.writerow([
                idx,
                c.get('class_name', ''),
                c.get('student_name', ''),
                c.get('parent_name', ''),
                c.get('relation', ''),
                c.get('phone', ''),
                c.get('address', ''),
                '是' if c.get('is_emergency') else '否',
                c.get('note', '')
            ])

        output.seek(0)
        csv_content = output.getvalue()

        filename = f"家长通讯录_{class_name or '全部'}.csv"
        return csv_content, filename
